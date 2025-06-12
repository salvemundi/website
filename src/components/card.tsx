// components/JoinCard.tsx
import Image from 'next/image';

import { Card } from '@/components/ui/card';

interface cardProps {
  description: string;
  image?: string;
}

const SamuCard: React.FC<cardProps> = ({ description, image = '' }) => {
  return (
    <Card className="bg-paars text-beige rounded-2xl p-6 flex flex-col items-center space-y-5">
      <Image
        src={image}
        alt="Salve Mundi Logo"
        width={700}
        height={700}
        className="w-3/4 h-auto object-contain"
      />
      <p className="text-center text-lg">{description}</p>
      <a
        href="https://discord.gg/salvemundi"
        target="_blank"
        rel="noopener noreferrer"
        className="text-beige bg-geel hover:bg-yellow-400 font-bold py-2 px-4 rounded transition-colors"
      >
        Word lid van onze Vereniging
      </a>
    </Card>
  );
};

export default SamuCard;
