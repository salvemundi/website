import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/header';
import BackToTopButton from '../components/backtotop';
import QRScanner from '../components/QRScanner';
import {
  checkInParticipant,
  isUserAuthorizedForAttendance,
  getEventSignupsWithCheckIn
} from '../lib/qr-service';
import exportEventSignups from '../lib/exportSignups';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [signups, setSignups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'scan' | 'list'>('scan');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const getSignupDisplayName = (signup: any) => {
    if (!signup) return 'Onbekende deelnemer';

    if (signup.directus_relations) {
      const first = signup.directus_relations.first_name || signup.directus_relations.firstName || '';
      const last = signup.directus_relations.last_name || signup.directus_relations.lastName || '';
      const full = `${first} ${last}`.trim();
      if (full) return full;
      if (signup.directus_relations.email) return signup.directus_relations.email;
    }

    if (signup.participant_name) return signup.participant_name;
    if (signup.name) return signup.name;
    if (signup.participant_email) return signup.participant_email;
    if (signup.email) return signup.email;

    return 'Onbekende deelnemer';
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, eventId]);

  const checkAuthorization = async () => {
    if (!user || !eventId) return;

    try {
      const authorized = await isUserAuthorizedForAttendance(user.id, parseInt(eventId));
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
      const eventData = await eventsApi.getById(eventId);
      setEvent(eventData);

      const signupData = await getEventSignupsWithCheckIn(parseInt(eventId));
      setSignups(signupData);
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = async (qrToken: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);

    try {
      const result = await checkInParticipant(qrToken);

      if (result.success && result.signup) {
        const userName = getSignupDisplayName(result.signup);

        setCheckInResult({
          success: true,
          message: result.message,
          participantName: userName,
          timestamp: new Date().toLocaleString('nl-NL'),
        });

        await getEventSignupsWithCheckIn(parseInt(eventId!)).then(setSignups);
      } else {
        setCheckInResult({
          success: false,
          message: result.message,
        });
      }

      setTimeout(() => {
        setCheckInResult(null);
        setIsProcessing(false);
      }, 2500);

    } catch (error) {
      console.error('Error during check-in:', error);
      setCheckInResult({
        success: false,
        message: 'Fout bij verwerken scan.',
      });
      
      setTimeout(() => {
        setCheckInResult(null);
        setIsProcessing(false);
      }, 2500);
    }
  };

  const handleScanError = (error: string) => {
    if (!error.includes('NotFoundException')) {
       console.error('Scan error:', error);
    }
  };

  const handleExportSignups = async () => {
    if (signups.length === 0) {
      setExportMessage('Er zijn nog geen inschrijvingen om te exporteren.');
      setTimeout(() => setExportMessage(null), 4000);
      return;
    }

    try {
      setIsExporting(true);
      setExportMessage(null);
      const safeName = event?.name
        ? event.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
        : 'activiteit';
      exportEventSignups(signups, `aanmeldingen-${safeName}.xlsx`);
      setExportMessage('Export gestart, controleer je downloads.');
    } catch (error) {
      console.error('Failed to export signups', error);
      setExportMessage('Exporteren is mislukt.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 4000);
    }
  };

  const handleToggleAttendance = async (signup: any) => {
    try {
      const newCheckedInStatus = !signup.checked_in;

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

      setSignups(prev => prev.map(s => 
        s.id === signup.id 
          ? { ...s, checked_in: newCheckedInStatus, checked_in_at: newCheckedInStatus ? new Date().toISOString() : null } 
          : s
      ));

    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  };

  const checkedInCount = signups.filter(s => s.checked_in).length;
  const totalCount = signups.length;
  const adminUrl = `${import.meta.env.VITE_DIRECTUS_URL || 'https://admin.salvemundi.nl'}/admin/content/events/${eventId}`;

  if (loading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="text-paars text-xl">Laden...</div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-beige flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Geen Toegang</h2>
          <p className="text-paars mb-4">
            Je hebt geen toestemming om aanwezigheid te controleren.
          </p>
          <p className="text-sm text-paars/70">
            Vraag toegang aan het bestuur of de commissievoorzitter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="AANWEZIGHEID CONTROLEREN"
        backgroundImage="/img/backgrounds/homepage-banner.jpg"
      />

      <main className="bg-beige min-h-screen">
        <section className="px-4 sm:px-10 py-10">
          {/* Event Info */}
          {event && (
            <div className="bg-paars rounded-3xl p-6 mb-6 shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-geel mb-2">{event.name}</h2>
                  <p className="text-beige text-sm">
                    {new Date(event.event_date).toLocaleDateString('nl-NL', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-4 text-beige flex-wrap">
                <div className="text-center">
                  <div className="text-3xl font-bold text-geel">{checkedInCount}</div>
                  <div className="text-sm">Ingecheckt</div>
                </div>
                <div className="text-2xl text-geel">/</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-beige">{totalCount}</div>
                  <div className="text-sm">Totaal</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation & Actions */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all ${activeTab === 'scan'
                ? 'bg-oranje text-white shadow-lg'
                : 'bg-white text-paars border-2 border-paars'
                }`}
            >
              📷 QR Scanner
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all ${activeTab === 'list'
                ? 'bg-oranje text-white shadow-lg'
                : 'bg-white text-paars border-2 border-paars'
                }`}
            >
              📋 Deelnemerslijst
            </button>
            
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none py-3 px-4 rounded-full font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all text-center flex items-center justify-center gap-2"
              title="Open dit event in Directus Admin"
            >
              ⚙️ <span className="hidden sm:inline">Beheer</span>
            </a>
          </div>

          {/* Scan Tab */}
          {activeTab === 'scan' && (
            <div className="bg-white rounded-3xl p-6 shadow-lg relative">
              <h3 className="text-2xl font-bold text-paars mb-4">QR Code Scanner</h3>

              {checkInResult && (
                <div className={`mb-4 p-6 rounded-xl text-center animate-in fade-in zoom-in duration-300 ${
                  checkInResult.success ? 'bg-green-100 border-4 border-green-500' : 'bg-red-100 border-4 border-red-500'
                }`}>
                  <p className={`text-2xl font-bold ${checkInResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {checkInResult.success ? '✅ SUCCES' : '❌ FOUT'}
                  </p>
                  <p className="text-lg font-semibold mt-2">{checkInResult.message}</p>
                  {checkInResult.participantName && (
                    <p className="text-xl mt-2 font-bold text-paars">{checkInResult.participantName}</p>
                  )}
                  <div className="mt-2 w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                     <div className="h-full bg-gray-500 animate-[width_2.5s_linear_forwards]" style={{width: '100%'}}></div>
                  </div>
                </div>
              )}

              {!isScanning ? (
                <button
                  onClick={() => setIsScanning(true)}
                  className="w-full bg-oranje text-white font-bold py-6 px-6 rounded-2xl hover:bg-geel hover:text-paars transition-all shadow-lg text-xl"
                >
                  📷 Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsScanning(false)}
                    className="w-full bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-all mb-4"
                  >
                    ⏹ Camera Stoppen
                  </button>
                  
                  <div className="rounded-xl overflow-hidden shadow-inner border-4 border-paars/20 relative">
                     {isProcessing && !checkInResult && (
                       <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-sm">
                         <span className="text-paars font-bold text-lg">Verwerken...</span>
                       </div>
                     )}
                     
                     <QRScanner
                      isScanning={isScanning}
                      onScanSuccess={handleScanSuccess}
                      onScanError={handleScanError}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Houd de QR code voor de camera. De scanner blijft open staan.
                  </p>
                </>
              )}
            </div>
          )}

          {/* List Tab */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-2xl font-bold text-paars">Deelnemerslijst</h3>
                <button
                  onClick={handleExportSignups}
                  disabled={isExporting || signups.length === 0}
                  className={`px-5 py-2 rounded-full font-semibold shadow-md transition-all w-full sm:w-auto ${signups.length === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-paars text-beige hover:bg-oranje'
                    } ${isExporting ? 'opacity-80 cursor-wait' : ''}`}
                >
                  {isExporting ? 'Exporteren...' : '📁 Exporteer Excel'}
                </button>
              </div>

              {exportMessage && (
                <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
                  exportMessage.includes('mislukt') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {exportMessage}
                </div>
              )}

              {signups.length === 0 ? (
                <div className="text-center py-8 text-paars">
                  <p>Nog geen inschrijvingen voor deze activiteit.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {signups.map((signup) => {
                    const userName = getSignupDisplayName(signup);
                    return (
                      <div
                        key={signup.id}
                        className={`p-4 rounded-lg border-2 ${signup.checked_in
                          ? 'bg-green-50 border-green-500'
                          : 'bg-gray-50 border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-paars">{userName}</p>
                            {(signup.directus_relations?.email || signup.participant_email || signup.email) && (
                              <p className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
                                {signup.directus_relations?.email || signup.participant_email || signup.email}
                              </p>
                            )}
                            {signup.checked_in && signup.checked_in_at && (
                              <p className="text-xs text-green-700 mt-1">
                                {new Date(signup.checked_in_at).toLocaleTimeString('nl-NL', {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAttendance(signup)}
                              className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all ${signup.checked_in
                                ? 'bg-green-500 hover:bg-red-500 text-white'
                                : 'bg-gray-300 hover:bg-green-500 text-gray-600 hover:text-white'
                                }`}
                              title={signup.checked_in ? 'Klik om uit te checken' : 'Klik om in te checken'}
                            >
                              {signup.checked_in ? '✓' : '+'}
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
      </main>

      <BackToTopButton />
    </>
  );
}