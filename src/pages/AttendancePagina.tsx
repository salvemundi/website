// Attendance Check-in Page for Committee Members
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/NavBar';
import Header from '../components/header';
import Footer from '../components/Footer';
import BackToTopButton from '../components/backtotop';
import QRScanner from '../components/QRScanner';
import { 
  checkInParticipant, 
  isUserCommitteeMember, 
  getEventSignupsWithCheckIn 
} from '../lib/qr-service';
import { eventsApi } from '../lib/api-clean';

interface CheckInResult {
  success: boolean;
  message: string;
  participantName?: string;
  timestamp?: string;
}

export default function AttendancePagina() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [signups, setSignups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scan' | 'list'>('scan');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!eventId) {
      navigate('/activiteiten');
      return;
    }

    checkAuthorization();
    loadEventAndSignups();
  }, [user, eventId]);

  const checkAuthorization = async () => {
    if (!user || !eventId) return;

    try {
      const authorized = await isUserCommitteeMember(user.id, parseInt(eventId));
      setIsAuthorized(authorized);

      if (!authorized) {
        setTimeout(() => navigate('/activiteiten'), 3000);
      }
    } catch (error) {
      console.error('Error checking authorization:', error);
      setIsAuthorized(false);
    }
  };

  const loadEventAndSignups = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      
      // Load event details
      const eventData = await eventsApi.getById(eventId);
      setEvent(eventData);

      // Load signups with check-in status
      const signupData = await getEventSignupsWithCheckIn(parseInt(eventId));
      setSignups(signupData);
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (qrToken: string) => {
    try {
      setIsScanning(false);
      
      const result = await checkInParticipant(qrToken);
      
      if (result.success && result.signup) {
        const userName = result.signup.directus_relations 
          ? `${result.signup.directus_relations.first_name || ''} ${result.signup.directus_relations.last_name || ''}`.trim()
          : 'Deelnemer';
        
        setCheckInResult({
          success: true,
          message: result.message,
          participantName: userName,
          timestamp: new Date().toLocaleString('nl-NL'),
        });

        // Refresh signups list
        await loadEventAndSignups();
      } else {
        setCheckInResult({
          success: false,
          message: result.message,
        });
      }

      // Clear result after 5 seconds
      setTimeout(() => {
        setCheckInResult(null);
      }, 5000);
    } catch (error) {
      console.error('Error during check-in:', error);
      setCheckInResult({
        success: false,
        message: 'Er is een fout opgetreden. Probeer het opnieuw.',
      });
    }
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
  };

  const handleToggleAttendance = async (signup: any) => {
    try {
      const newCheckedInStatus = !signup.checked_in;
      
      // Update in database
      await fetch(`${import.meta.env.VITE_DIRECTUS_URL}/items/event_signups/${signup.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          checked_in: newCheckedInStatus,
          checked_in_at: newCheckedInStatus ? new Date().toISOString() : null,
        }),
      });

      // Refresh the list
      await loadEventAndSignups();
      
      // Show success message
      const userName = signup.directus_relations
        ? `${signup.directus_relations.first_name || ''} ${signup.directus_relations.last_name || ''}`.trim()
        : 'Deelnemer';
      
      setCheckInResult({
        success: true,
        message: newCheckedInStatus 
          ? `${userName} is nu ingecheckt` 
          : `${userName} is nu uitgecheckt`,
        participantName: userName,
        timestamp: new Date().toLocaleString('nl-NL'),
      });

      // Clear result after 3 seconds
      setTimeout(() => {
        setCheckInResult(null);
      }, 3000);
    } catch (error) {
      console.error('Error toggling attendance:', error);
      setCheckInResult({
        success: false,
        message: 'Er is een fout opgetreden bij het wijzigen van de aanwezigheid.',
      });
      
      setTimeout(() => {
        setCheckInResult(null);
      }, 3000);
    }
  };

  const checkedInCount = signups.filter(s => s.checked_in).length;
  const totalCount = signups.length;

  if (loading || isAuthorized === null) {
    return (
      <>
        <Navbar activePage="Activiteiten" />
        <div className="min-h-screen bg-beige flex items-center justify-center">
          <div className="text-paars text-xl">Laden...</div>
        </div>
      </>
    );
  }

  if (isAuthorized === false) {
    return (
      <>
        <Navbar activePage="Activiteiten" />
        <div className="min-h-screen bg-beige flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Geen Toegang</h2>
            <p className="text-paars mb-4">
              Je hebt geen toestemming om aanwezigheid te controleren voor deze activiteit.
            </p>
            <p className="text-sm text-paars/70">
              Alleen commissieleden van deze activiteit kunnen aanwezigheid controleren.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col w-full">
        <Navbar activePage="Activiteiten" />
        <Header
          title="AANWEZIGHEID CONTROLEREN"
          backgroundImage="/img/backgrounds/homepage-banner.jpg"
        />
      </div>

      <main className="bg-beige min-h-screen">
        <section className="px-4 sm:px-10 py-10">
          {/* Event Info */}
          {event && (
            <div className="bg-paars rounded-3xl p-6 mb-6 shadow-lg">
              <h2 className="text-2xl font-bold text-geel mb-2">{event.name}</h2>
              <p className="text-beige text-sm">
                {new Date(event.event_date).toLocaleDateString('nl-NL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <div className="mt-4 flex items-center gap-4 text-beige">
                <div className="text-center">
                  <div className="text-3xl font-bold text-geel">{checkedInCount}</div>
                  <div className="text-sm">Ingecheckt</div>
                </div>
                <div className="text-2xl text-geel">/</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-beige">{totalCount}</div>
                  <div className="text-sm">Totaal Ingeschreven</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all ${
                activeTab === 'scan'
                  ? 'bg-oranje text-white shadow-lg'
                  : 'bg-white text-paars border-2 border-paars'
              }`}
            >
              📷 QR Scanner
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all ${
                activeTab === 'list'
                  ? 'bg-oranje text-white shadow-lg'
                  : 'bg-white text-paars border-2 border-paars'
              }`}
            >
              📋 Deelnemerslijst
            </button>
          </div>

          {/* Scan Tab */}
          {activeTab === 'scan' && (
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-paars mb-4">QR Code Scanner</h3>
              
              {/* Check-in Result */}
              {checkInResult && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    checkInResult.success
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-red-100 border-2 border-red-500'
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      checkInResult.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {checkInResult.success ? '✅ ' : '❌ '}
                    {checkInResult.message}
                  </p>
                  {checkInResult.participantName && (
                    <p className="text-sm mt-1 text-gray-700">
                      <strong>Deelnemer:</strong> {checkInResult.participantName}
                    </p>
                  )}
                  {checkInResult.timestamp && (
                    <p className="text-sm text-gray-600">
                      {checkInResult.timestamp}
                    </p>
                  )}
                </div>
              )}

              {/* Scanner Controls */}
              {!isScanning ? (
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full bg-oranje text-white font-bold py-4 px-6 rounded-full hover:bg-geel hover:text-paars transition-all shadow-lg mb-6"
                >
                  📷 Start Scanner
                </button>
              ) : (
                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full bg-red-500 text-white font-bold py-4 px-6 rounded-full hover:bg-red-600 transition-all shadow-lg mb-6"
                >
                  ⏹ Stop Scanner
                </button>
              )}

              {/* QR Scanner */}
              <QRScanner
                isScanning={isScanning}
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />
            </div>
          )}

          {/* List Tab */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold text-paars mb-4">Deelnemerslijst</h3>
              
              {/* Check-in Result for manual toggle */}
              {checkInResult && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    checkInResult.success
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-red-100 border-2 border-red-500'
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      checkInResult.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {checkInResult.success ? '✅ ' : '❌ '}
                    {checkInResult.message}
                  </p>
                </div>
              )}
              
              {signups.length === 0 ? (
                <div className="text-center py-8 text-paars">
                  <p>Nog geen inschrijvingen voor deze activiteit.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signups.map((signup) => {
                    const userName = signup.directus_relations
                      ? `${signup.directus_relations.first_name || ''} ${signup.directus_relations.last_name || ''}`.trim()
                      : 'Onbekende deelnemer';
                    
                    return (
                      <div
                        key={signup.id}
                        className={`p-4 rounded-lg border-2 ${
                          signup.checked_in
                            ? 'bg-green-50 border-green-500'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-paars">{userName}</p>
                            {signup.directus_relations?.email && (
                              <p className="text-sm text-gray-600">
                                {signup.directus_relations.email}
                              </p>
                            )}
                            {signup.checked_in && signup.checked_in_at && (
                              <p className="text-xs text-green-700 mt-1">
                                ✅ Ingecheckt: {new Date(signup.checked_in_at).toLocaleString('nl-NL')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Status Badge */}
                            {signup.checked_in ? (
                              <span className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                ✓ Aanwezig
                              </span>
                            ) : (
                              <span className="inline-block bg-gray-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                - Afwezig
                              </span>
                            )}
                            
                            {/* Toggle Button */}
                            <button
                              onClick={() => handleToggleAttendance(signup)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                signup.checked_in
                                  ? 'bg-red-500 hover:bg-red-600 text-white'
                                  : 'bg-oranje hover:bg-geel text-white hover:text-paars'
                              }`}
                              title={signup.checked_in ? 'Uitchecken' : 'Inchecken'}
                            >
                              {signup.checked_in ? '✗ Uitchecken' : '✓ Inchecken'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <Footer />
      </main>

      <BackToTopButton />
    </>
  );
}
