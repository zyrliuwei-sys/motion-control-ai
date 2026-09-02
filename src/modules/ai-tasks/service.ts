import { and, desc, eq, isNull } from 'drizzle-orm';

import { db } from '@/core/db';
import { aiTask, user } from '@/config/db/schema';
import {
  consume,
  refundConsumedCredits,
  revoke,
} from '@/modules/credits/service';
import { getUuid } from '@/lib/hash';

export enum AITaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export const FREE_IMAGE_TRIAL_SCENE = 'free_image_trial';

/**
 * Create an AI task with optional credit consumption.
 */
export async function createTask(params: {
  userId: string;
  mediaType: string;
  provider: string;
  model: string;
  prompt: string;
  costCredits?: number;
  options?: any;
  /** Atomically apply a new user's one-time single-image entitlement. */
  requestFreeImageTrial?: boolean;
}): Promise<any> {
  const {
    userId,
    mediaType,
    provider,
    model,
    prompt,
    costCredits,
    options,
    requestFreeImageTrial,
  } = params;

  return db().transaction(async (tx: any) => {
    const taskId = getUuid();
    let usesFreeImageTrial = false;

    // The conditional update is the entitlement claim: concurrent requests
    // cannot both receive the free generation.
    if (requestFreeImageTrial) {
      const claimedUsers = await tx
        .update(user)
        .set({ freeImageTrialAvailable: false })
        .where(and(eq(user.id, userId), eq(user.freeImageTrialAvailable, true)))
        .returning({ id: user.id });
      usesFreeImageTrial = claimedUsers.length > 0;
    }

    const billedCredits = usesFreeImageTrial ? 0 : costCredits || 0;

    // 1. Insert task
    const taskData: any = {
      id: taskId,
      userId,
      mediaType,
      provider,
      model,
      prompt,
      options: options === undefined ? null : JSON.stringify(options),
      status: AITaskStatus.PENDING,
      costCredits: billedCredits,
      scene: usesFreeImageTrial ? FREE_IMAGE_TRIAL_SCENE : '',
    };

    const [task] = await tx.insert(aiTask).values(taskData).returning();
    if (!task) throw new Error('Unable to create AI task');

    // 2. Consume credits if cost > 0
    if (billedCredits > 0) {
      const result = await consume({
        userId,
        credits: billedCredits,
        scene: 'ai_task',
        description: `AI ${mediaType} generation`,
        metadata: JSON.stringify({ taskId: task.id }),
        tx,
      });

      if (!result.success) {
        throw new Error('Insufficient credits');
      }

      // Store consumed credit ID for potential revocation
      if (result.consumedCredit) {
        const [updatedTask] = await tx
          .update(aiTask)
          .set({
            creditId: result.consumedCredit.id,
          })
          .where(eq(aiTask.id, task.id))
          .returning();

        return updatedTask ?? { ...task, creditId: result.consumedCredit.id };
      }
    }

    return task;
  });
}

/**
 * Update task status. Revokes credits on failure.
 */
export async function updateTask(params: {
  taskId: string;
  status: AITaskStatus;
  taskResult?: any;
}) {
  const { taskId, status, taskResult } = params;

  const [task] = await db()
    .select()
    .from(aiTask)
    .where(eq(aiTask.id, taskId))
    .limit(1);

  if (!task) throw new Error('Task not found');

  // Update task
  const updateData: any = { status };
  if (taskResult) {
    updateData.taskResult = JSON.stringify(taskResult);
  }

  await db().update(aiTask).set(updateData).where(eq(aiTask.id, taskId));

  // Revoke credits on an upstream failure or cancellation.
  if (
    (status === AITaskStatus.FAILED || status === AITaskStatus.CANCELED) &&
    task.creditId
  ) {
    await revoke(task.creditId);
  }

  // A provider-side failure should not spend a new user's free chance. The
  // conditional restore leaves any later successful claim untouched.
  if (
    (status === AITaskStatus.FAILED || status === AITaskStatus.CANCELED) &&
    task.scene === FREE_IMAGE_TRIAL_SCENE
  ) {
    await db()
      .update(user)
      .set({ freeImageTrialAvailable: true })
      .where(
        and(eq(user.id, task.userId), eq(user.freeImageTrialAvailable, false))
      );
  }
}

/**
 * Settle a pre-authorized task once the provider reports its actual output
 * duration. Reservations are only reduced; they can never be increased after
 * an upstream request has been accepted.
 */
export async function settleTaskCreditCost(params: {
  taskId: string;
  costCredits: number;
}) {
  const finalCost = Math.max(0, Math.floor(params.costCredits));

  return db().transaction(async (tx: any) => {
    const [task] = await tx
      .select()
      .from(aiTask)
      .where(eq(aiTask.id, params.taskId))
      .limit(1)
      .for('update');

    if (!task) throw new Error('Task not found');
    if (!task.creditId || finalCost >= task.costCredits) return task;

    const refund = await refundConsumedCredits({
      consumeCreditId: task.creditId,
      credits: task.costCredits - finalCost,
      tx,
    });

    if (refund.refundedCredits !== task.costCredits - finalCost) {
      throw new Error('Unable to settle task credits');
    }

    const [updatedTask] = await tx
      .update(aiTask)
      .set({ costCredits: finalCost })
      .where(eq(aiTask.id, task.id))
      .returning();

    return updatedTask ?? { ...task, costCredits: finalCost };
  });
}

/**
 * Get tasks for a user.
 */
export async function getTasks(params: {
  userId: string;
  mediaType?: string;
  provider?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, mediaType, provider, status, page = 1, limit = 20 } = params;

  return db()
    .select()
    .from(aiTask)
    .where(
      and(
        eq(aiTask.userId, userId),
        mediaType ? eq(aiTask.mediaType, mediaType) : undefined,
        provider ? eq(aiTask.provider, provider) : undefined,
        status ? eq(aiTask.status, status) : undefined,
        isNull(aiTask.deletedAt)
      )
    )
    .orderBy(desc(aiTask.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

/**
 * Find task by ID.
 */
export async function findTask(taskId: string) {
  const [result] = await db()
    .select()
    .from(aiTask)
    .where(eq(aiTask.id, taskId))
    .limit(1);
  return result;
}
