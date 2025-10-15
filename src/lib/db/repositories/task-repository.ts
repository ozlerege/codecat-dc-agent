/**
 * Task Repository
 * 
 * Handles all database operations related to tasks.
 * Provides a clean interface for task CRUD operations.
 * 
 * @module db/repositories
 */

import { BaseRepository } from "./base-repository";
import { TASK_CONFIG, type TaskStatus } from "@/lib/config/constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/schema";

/**
 * Task record type from database
 */
export type TaskRecord = {
  id: string;
  user_id: string | null;
  discord_user_id: string;
  guild_id: string;
  prompt: string;
  status: TaskStatus;
  pr_url: string | null;
  created_at: string;
};

/**
 * Input for creating a new task
 */
export type CreateTaskInput = {
  userId?: string | null;
  discordUserId: string;
  guildId: string;
  prompt: string;
  status?: TaskStatus;
  prUrl?: string | null;
};

/**
 * Input for updating a task
 */
export type UpdateTaskInput = {
  status?: TaskStatus;
  prUrl?: string | null;
};

/**
 * Task Repository
 * Manages all task-related database operations
 */
export class TaskRepository extends BaseRepository {
  constructor(client: SupabaseClient<Database>) {
    super(client, "TaskRepository");
  }

  /**
   * Find task by ID
   * 
   * @param taskId - Task UUID
   * @returns Task record or null if not found
   */
  async findById(taskId: string): Promise<TaskRecord | null> {
    this.validateRequired({ taskId }, 'findById');

    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();

      if (error) throw error;

      this.logSuccess('findById', { taskId, found: !!data });
      return data as TaskRecord | null;
    } catch (error) {
      this.handleError(error, 'findById', { taskId });
    }
  }

  /**
   * Find recent tasks for a guild
   * 
   * @param guildUuid - Guild UUID (not Discord guild ID)
   * @param limit - Maximum number of tasks to return
   * @returns Array of task records
   */
  async findRecentByGuild(
    guildUuid: string,
    limit: number = TASK_CONFIG.limits.default
  ): Promise<TaskRecord[]> {
    this.validateRequired({ guildUuid }, 'findRecentByGuild');

    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('guild_id', guildUuid)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      this.logSuccess('findRecentByGuild', { guildUuid, limit, found: data?.length ?? 0 });
      return this.safeArray(data) as TaskRecord[];
    } catch (error) {
      this.handleError(error, 'findRecentByGuild', { guildUuid, limit });
    }
  }

  /**
   * Find tasks by status
   * 
   * @param status - Task status to filter by
   * @param limit - Maximum number of tasks to return
   * @returns Array of task records
   */
  async findByStatus(
    status: TaskStatus,
    limit: number = TASK_CONFIG.limits.default
  ): Promise<TaskRecord[]> {
    this.validateRequired({ status }, 'findByStatus');

    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      this.logSuccess('findByStatus', { status, limit, found: data?.length ?? 0 });
      return this.safeArray(data) as TaskRecord[];
    } catch (error) {
      this.handleError(error, 'findByStatus', { status, limit });
    }
  }

  /**
   * Find tasks by Discord user ID
   * 
   * @param discordUserId - Discord user ID
   * @param limit - Maximum number of tasks to return
   * @returns Array of task records
   */
  async findByDiscordUser(
    discordUserId: string,
    limit: number = TASK_CONFIG.limits.default
  ): Promise<TaskRecord[]> {
    this.validateRequired({ discordUserId }, 'findByDiscordUser');

    try {
      const { data, error } = await this.client
        .from('tasks')
        .select('*')
        .eq('discord_user_id', discordUserId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      this.logSuccess('findByDiscordUser', { discordUserId, limit, found: data?.length ?? 0 });
      return this.safeArray(data) as TaskRecord[];
    } catch (error) {
      this.handleError(error, 'findByDiscordUser', { discordUserId, limit });
    }
  }

  /**
   * Create a new task
   * 
   * @param input - Task creation data
   * @returns Created task record
   */
  async create(input: CreateTaskInput): Promise<TaskRecord> {
    this.validateRequired(
      {
        discordUserId: input.discordUserId,
        guildId: input.guildId,
        prompt: input.prompt,
      },
      'create'
    );

    const {
      userId = null,
      discordUserId,
      guildId,
      prompt,
      status = TASK_CONFIG.status.PENDING,
      prUrl = null,
    } = input;

    try {
      const insertPayload = {
        user_id: userId,
        discord_user_id: discordUserId,
        guild_id: guildId,
        prompt,
        status,
        pr_url: prUrl,
      } satisfies Database["public"]["Tables"]["tasks"]["Insert"];

      const { data, error } = await this.client
        .from("tasks")
        .insert(insertPayload as never)
        .select("*")
        .single();
      if (error) throw error;

      const typedData =
        data as Database["public"]["Tables"]["tasks"]["Row"] | null;
      const task = this.requireData(typedData, "create", "Task");
      this.logSuccess("create", { taskId: task.id, guildId, status });

      return task as TaskRecord;
    } catch (error) {
      this.handleError(error, 'create', { discordUserId, guildId });
    }
  }

  /**
   * Update a task
   * 
   * @param taskId - Task UUID
   * @param updates - Fields to update
   * @returns Updated task record
   */
  async update(taskId: string, updates: UpdateTaskInput): Promise<TaskRecord> {
    this.validateRequired({ taskId }, 'update');

    if (Object.keys(updates).length === 0) {
      throw this.handleError(
        new Error('No updates provided'),
        'update',
        { taskId }
      );
    }

    try {
      const dbUpdates: Database["public"]["Tables"]["tasks"]["Update"] = {};

      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
      }
      if (updates.prUrl !== undefined) {
        dbUpdates.pr_url = updates.prUrl;
      }

      const { data, error } = await this.client
        .from("tasks")
        .update(dbUpdates as never)
        .eq("id", taskId)
        .select("*")
        .single();

      if (error) throw error;

      const typedData =
        data as Database["public"]["Tables"]["tasks"]["Row"] | null;
      const task = this.requireData(typedData, "update", "Task");
      this.logSuccess("update", {
        taskId,
        updatedFields: Object.keys(dbUpdates).filter(
          (key) => dbUpdates[key as keyof typeof dbUpdates] !== undefined
        ),
      });

      return task as TaskRecord;
    } catch (error) {
      this.handleError(error, 'update', { taskId, updates });
    }
  }

  /**
   * Update task status
   * 
   * @param taskId - Task UUID
   * @param status - New task status
   * @returns Updated task record
   */
  async updateStatus(taskId: string, status: TaskStatus): Promise<TaskRecord> {
    return this.update(taskId, { status });
  }

  /**
   * Mark task as completed with PR URL
   * 
   * @param taskId - Task UUID
   * @param prUrl - Pull request URL
   * @returns Updated task record
   */
  async complete(taskId: string, prUrl: string): Promise<TaskRecord> {
    return this.update(taskId, {
      status: TASK_CONFIG.status.COMPLETED,
      prUrl,
    });
  }

  /**
   * Mark task as rejected
   * 
   * @param taskId - Task UUID
   * @returns Updated task record
   */
  async reject(taskId: string): Promise<TaskRecord> {
    return this.updateStatus(taskId, TASK_CONFIG.status.REJECTED);
  }

  /**
   * Mark task as in progress
   * 
   * @param taskId - Task UUID
   * @returns Updated task record
   */
  async startProgress(taskId: string): Promise<TaskRecord> {
    return this.updateStatus(taskId, TASK_CONFIG.status.IN_PROGRESS);
  }

  /**
   * Delete a task
   * 
   * @param taskId - Task UUID
   */
  async delete(taskId: string): Promise<void> {
    this.validateRequired({ taskId }, 'delete');

    try {
      const { error } = await this.client
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      this.logSuccess('delete', { taskId });
    } catch (error) {
      this.handleError(error, 'delete', { taskId });
    }
  }

  /**
   * Count tasks by status for a guild
   * 
   * @param guildUuid - Guild UUID
   * @param status - Task status
   * @returns Number of tasks with the given status
   */
  async countByStatus(guildUuid: string, status: TaskStatus): Promise<number> {
    this.validateRequired({ guildUuid, status }, 'countByStatus');

    try {
      const { count, error } = await this.client
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('guild_id', guildUuid)
        .eq('status', status);

      if (error) throw error;

      this.logSuccess('countByStatus', { guildUuid, status, count: count ?? 0 });
      return count ?? 0;
    } catch (error) {
      this.handleError(error, 'countByStatus', { guildUuid, status });
    }
  }
}
