// AttendanceButton - Shows button for committee members to check attendance
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isUserCommitteeMember } from '../lib/qr-service';

interface AttendanceButtonProps {
  eventId: number;
  eventName: string;
}

const AttendanceButton: React.FC<AttendanceButtonProps> = ({ eventId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [canCheckAttendance, setCanCheckAttendance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPermission();
  }, [user, eventId]);

  const checkPermission = async () => {
    if (!user || !eventId) {
      setCanCheckAttendance(false);
      setLoading(false);
      return;
    }

    try {
      const hasPermission = await isUserCommitteeMember(user.id, eventId);
      setCanCheckAttendance(hasPermission);
    } catch (error) {
      console.error('Error checking attendance permission:', error);
      setCanCheckAttendance(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !canCheckAttendance) {
    return null;
  }

  return (
    <button
      onClick={() => navigate(`/attendance/${eventId}`)}
      className="w-full bg-oranje text-white font-semibold py-2.5 px-5 rounded-full hover:bg-geel hover:text-paars transition-all shadow-lg flex items-center justify-center gap-2"
    >
      <span>📋</span>
      <span>Aanwezigheid Controleren</span>
    </button>
  );
};

export default AttendanceButton;
