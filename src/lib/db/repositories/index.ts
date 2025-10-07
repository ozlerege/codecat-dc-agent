/**
 * Repository Factory and Exports
 * 
 * Provides factory functions for creating repository instances
 * and exports all repository classes and types.
 * 
 * @module db/repositories
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../schema';
import { GuildRepository } from './guild-repository';
import { TaskRepository } from './task-repository';

/**
 * Repository factory for creating repository instances
 * 
 * @example
 * ```ts
 * import { createRepositories } from '@/lib/db/repositories';
 * import { createClient } from '@/lib/db/server';
 * 
 * const supabase = await createClient();
 * const repos = createRepositories(supabase);
 * 
 * const guild = await repos.guilds.findById('123', 'user-id');
 * const tasks = await repos.tasks.findRecentByGuild('guild-uuid');
 * ```
 */
export function createRepositories(client: SupabaseClient<Database>) {
  return {
    guilds: new GuildRepository(client),
    tasks: new TaskRepository(client),
  };
}

/**
 * Type for the repository collection
 */
export type Repositories = ReturnType<typeof createRepositories>;

// Export repository classes
export { GuildRepository, TaskRepository };

// Export base repository and error class
export { BaseRepository, RepositoryError } from './base-repository';

// Export types from repositories
export type {
  GuildRecord,
  CreateGuildInput,
  UpdateGuildInput,
} from './guild-repository';

export type {
  TaskRecord,
  CreateTaskInput,
  UpdateTaskInput,
} from './task-repository';
