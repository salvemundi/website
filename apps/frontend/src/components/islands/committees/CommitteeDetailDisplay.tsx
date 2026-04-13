import { CommitteeDetail } from '@/components/ui/committees/CommitteeDetail';

interface CommitteeDetailDisplayProps {
    committee: any;
}

export default function CommitteeDetailDisplay({ committee }: CommitteeDetailDisplayProps) {
    return <CommitteeDetail committee={committee} />;
}
