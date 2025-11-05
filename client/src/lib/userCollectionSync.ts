import { User } from '@/types';
import {
  CollectionMutationOptions,
  getCollectionStore,
} from '@/lib/localCollectionStore';
import { getAllLocalUsers, updateLocalUserApproval } from '@/lib/localAuth';

const SILENT_MUTATION: CollectionMutationOptions = Object.freeze({ silent: true });

export async function syncUserToCollection(
  user: User,
  options: CollectionMutationOptions = SILENT_MUTATION,
): Promise<void> {
  const store = getCollectionStore<User>('users');
  const existing = store.getById(user.id);
  const mutationOptions = options ?? SILENT_MUTATION;

  if (existing) {
    await store.update(user.id, user, mutationOptions);
    return;
  }

  await store.add(user, mutationOptions);
}

export async function syncAllUsersToCollection(
  options: CollectionMutationOptions = SILENT_MUTATION,
): Promise<void> {
  const users = getAllLocalUsers();
  await Promise.all(users.map((user) => syncUserToCollection(user, options)));
}

export async function updateUserApprovalAndSync(
  userId: string,
  approved: boolean,
): Promise<User> {
  const updatedUser = updateLocalUserApproval(userId, approved);

  if (!updatedUser) {
    throw new Error('User not found');
  }

  await syncUserToCollection(updatedUser, SILENT_MUTATION);
  return updatedUser;
}
