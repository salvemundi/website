import { getCommitteesWithMembers } from '@/shared/api/salvemundi-server';
import CommitteesContent from './CommitteesContent';

export default async function CommitteesPage() {
    const initialCommittees = await getCommitteesWithMembers();

    return <CommitteesContent initialCommittees={initialCommittees} />;
}
