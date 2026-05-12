import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';

type AstroRequest = {
  first_name: string;
  last_name: string;
  dob: string;
  country: string;
};

type UserInfo = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

type AstroResponse = {
  zodiac: string;
  luck_score: number;
  energy_level: string;
  lucky_color: string;
  lucky_color_hex: string;
  message: string;
  personality: string;
  dos: string[];
  donts: string[];
  daily_message: string;
  energy_status: string;
};

type HistoryItem = AstroResponse & {
  id: number;
  created_at: string;
  first_name: string;
  last_name: string;
  dob: string;
  country: string;
};

type CompatibilityRequest = {
  user_a: AstroRequest;
  user_b: AstroRequest;
};

type CompatibilityResponse = {
  sign_a: string;
  sign_b: string;
  match_score: number;
  compatibility: string;
  summary: string;
};

const DEFAULT_COUNTRIES = ['Auto-detect', 'United States', 'Canada', 'United Kingdom', 'India', 'Australia', 'Brazil', 'Japan'];

const progressColor = (score: number) => {
  if (score >= 70) return 'from-emerald-400 to-lime-400';
  if (score >= 40) return 'from-amber-400 to-orange-500';
  return 'from-rose-400 to-red-500';
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

function App() {
  const [form, setForm] = useState<AstroRequest>({
    first_name: '',
    last_name: '',
    dob: '',
    country: 'Auto-detect',
  });
  const [report, setReport] = useState<AstroResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<HistoryItem | null>(null);
  const [compatibilityForm, setCompatibilityForm] = useState<CompatibilityRequest>({
    user_a: { first_name: '', last_name: '', dob: '', country: 'United States' },
    user_b: { first_name: '', last_name: '', dob: '', country: 'United States' },
  });
  const [compatibility, setCompatibility] = useState<CompatibilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('cosmic-token');
    if (savedToken) {
      setToken(savedToken);
      refreshSession(savedToken);
    }
  }, []);

  useEffect(() => {
    if (user) {
      handleHistoryFetch('', '');
    }
  }, [user]);

  useEffect(() => {
    if (form.country !== 'Auto-detect') return;
    const locale = navigator.language || 'en-US';
    const countryCode = locale.split('-')[1] || 'US';
    setForm((current) => ({ ...current, country: countryCode === 'US' ? 'United States' : countryCode }));
  }, []);

  const canSubmit = useMemo(
    () => Boolean(form.first_name.trim() && form.last_name.trim() && form.dob),
    [form]
  );

  const handleChange = (field: keyof AstroRequest, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const authHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  };

  const refreshSession = async (savedToken: string) => {
    setSessionLoading(true);
    try {
      const response = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        handleLogout();
        return;
      }
      const data = await response.json();
      setUser(data);
      localStorage.setItem('cosmic-user', JSON.stringify(data));
      setAuthError('');
    } catch (err) {
      handleLogout();
    } finally {
      setSessionLoading(false);
    }
  };

  const handleHistoryFetch = async (firstName: string, lastName: string) => {
    setHistoryLoading(true);
    try {
      const query = new URLSearchParams();
      if (firstName) query.set('first_name', firstName);
      if (lastName) query.set('last_name', lastName);
      const response = await fetch(`${API_URL}/history?${query.toString()}`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error('Unable to load history.');
      const data = await response.json();
      setHistory(data);
      setSelectedReport(data.length ? data[0] : null);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectReport = (reportItem: HistoryItem) => {
    setSelectedReport(reportItem);
  };

  useEffect(() => {
    if (report) {
      handleHistoryFetch(form.first_name, form.last_name);
    }
  }, [report]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!canSubmit) {
      setError('Please complete all fields to generate your report.');
      return;
    }

    setLoading(true);
    setReport(null);
    setCompatibility(null);

    try {
      const response = await fetch(`${API_URL}/generate-astro-report`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Unable to generate report.');
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError('Failed to fetch astrology report. Make sure the backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompatibilitySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCompatibilityLoading(true);
    try {
      const response = await fetch(`${API_URL}/compatibility-check`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(compatibilityForm),
      });
      if (!response.ok) throw new Error('Unable to calculate compatibility.');
      const data = await response.json();
      setCompatibility(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCompatibilityLoading(false);
    }
  };

  const handleShareImage = async () => {
    const element = document.getElementById('report-card');
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: '#050816' });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `cosmic-astro-report-${form.first_name}-${form.last_name}.png`;
    link.click();
  };

  const handleAuthResponse = (tokenValue: string, userInfo: UserInfo) => {
    setToken(tokenValue);
    setUser(userInfo);
    localStorage.setItem('cosmic-token', tokenValue);
    localStorage.setItem('cosmic-user', JSON.stringify(userInfo));
    setAuthError('');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cosmic-token');
    localStorage.removeItem('cosmic-user');
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    if (!email || !password || !confirmPassword) {
      setAuthError('Please fill in all registration fields.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email, password, first_name: form.first_name, last_name: form.last_name }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Unable to register.');
      }
      const data = await response.json();
      handleAuthResponse(data.token, data.user);
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    setAuthLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Unable to login.');
      }
      const data = await response.json();
      handleAuthResponse(data.token, data.user);
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-cosmic-radial text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10">
        <header className="mb-8 rounded-3xl bg-white/5 p-6 shadow-glass backdrop-blur-xl">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-200/70">Cosmic Astrology</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Personalized daily insights crafted from your stars.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">Enter your details to reveal your zodiac mood, luck score, daily guidance, and color energy for the day.</p>
          </div>
        </header>

        <main className="grid gap-8 lg:grid-cols-[420px_1fr]">
          <section className="space-y-6 rounded-3xl bg-white/10 p-6 shadow-glass backdrop-blur-xl">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">Your cosmic profile</h2>
              <p className="text-slate-300">Fill in your name, date of birth, and location to receive a daily astrology report.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200">First Name</label>
                <input
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  placeholder="Ariana"
                  value={form.first_name}
                  onChange={(event) => handleChange('first_name', event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200">Last Name</label>
                <input
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  placeholder="Star"
                  value={form.last_name}
                  onChange={(event) => handleChange('last_name', event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200">Date of Birth</label>
                <input
                  type="date"
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  value={form.dob}
                  onChange={(event) => handleChange('dob', event.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-200">Country</label>
                <select
                  className="w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  value={form.country}
                  onChange={(event) => handleChange('country', event.target.value)}
                >
                  {DEFAULT_COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {error ? <p className="text-sm text-rose-300">{error}</p> : null}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-violet-500 to-sky-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Creating your report...' : 'Generate my report'}
              </button>
            </form>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-200/80">Account</p>
                  <p className="mt-2 text-slate-300">Save reports to your profile and access your personal history.</p>
                </div>
                {user ? (
                  <button
                    type="button"
                    className="rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                ) : null}
              </div>

              {user ? (
                <div className="space-y-3 rounded-3xl bg-slate-900/90 p-4 text-slate-100">
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Welcome back</p>
                  <p className="font-semibold text-white">{user.first_name}</p>
                  <p className="text-sm text-slate-400">Your saved astrology reports are ready. Tap any report below to view full details.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={`rounded-3xl px-4 py-2 text-sm font-semibold ${authMode === 'login' ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-300'}`}
                      onClick={() => setAuthMode('login')}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      className={`rounded-3xl px-4 py-2 text-sm font-semibold ${authMode === 'register' ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-300'}`}
                      onClick={() => setAuthMode('register')}
                    >
                      Register
                    </button>
                  </div>

                  <form className="space-y-4" onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-200">Email</label>
                      <input
                        type="email"
                        className="w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-200">Password</label>
                      <input
                        type="password"
                        className="w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    {authMode === 'register' ? (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-200">Confirm Password</label>
                        <input
                          type="password"
                          className="w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    ) : null}
                    {authError ? <p className="text-sm text-rose-300">{authError}</p> : null}
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={authLoading}
                    >
                      {authLoading ? 'Working…' : authMode === 'login' ? 'Login' : 'Register'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{user ? 'My Reports' : 'History'}</p>
                  <p className="mt-2 text-slate-300">{user ? 'Saved reports for your account.' : 'Recent reports for this name.'}</p>
                </div>
                <button
                  type="button"
                  className="rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  onClick={() => handleHistoryFetch(form.first_name, form.last_name)}
                >
                  Refresh
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {historyLoading ? (
                  <p className="text-slate-400">Loading history...</p>
                ) : history.length ? (
                  <div className="space-y-3">
                    <div className="grid gap-3">
                      {history.slice(0, 3).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectReport(item)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${selectedReport?.id === item.id ? 'border-cyan-400 bg-slate-800/90' : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'}`}
                        >
                          <p className="text-sm text-slate-300">{item.created_at.slice(0, 10)} · {item.dob}</p>
                          <p className="mt-2 text-white">{item.zodiac} · Luck {item.luck_score}</p>
                          <p className="mt-2 text-slate-400">{item.country}</p>
                        </button>
                      ))}
                    </div>
                    {selectedReport ? (
                      <div className="rounded-3xl bg-slate-900/80 p-4">
                        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Selected report</p>
                        <p className="mt-3 text-lg font-semibold text-white">{selectedReport.first_name} {selectedReport.last_name} · {selectedReport.zodiac}</p>
                        <p className="mt-2 text-slate-400">Born {selectedReport.dob} in {selectedReport.country}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-3xl bg-slate-950/80 p-4">
                            <p className="text-sm uppercase tracking-[0.3em] text-sky-200/80">Energy</p>
                            <p className="mt-2 text-white">{selectedReport.energy_level}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-950/80 p-4">
                            <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Lucky color</p>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="h-9 w-9 rounded-full" style={{ backgroundColor: selectedReport.lucky_color_hex }} />
                              <span className="text-white">{selectedReport.lucky_color}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <div className="rounded-3xl bg-slate-950/80 p-4">
                            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Do’s</p>
                            <ul className="mt-3 space-y-2 text-slate-200">
                              {selectedReport.dos.map((item) => (
                                <li key={item}>✔ {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-3xl bg-slate-950/80 p-4">
                            <p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Don’ts</p>
                            <ul className="mt-3 space-y-2 text-slate-200">
                              {selectedReport.donts.map((item) => (
                                <li key={item}>✖ {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-slate-400">{user ? 'No saved reports yet. Generate a report to add one.' : 'Submit a report to populate saved history.'}</p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            {report ? (
              <div className="space-y-6 rounded-3xl bg-white/10 p-6 shadow-glass backdrop-blur-xl">
                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                  <div className="rounded-3xl bg-slate-950/70 p-6 text-center shadow-xl shadow-slate-950/20">
                    <div className={`mx-auto mb-6 h-40 w-40 rounded-full bg-gradient-to-br ${progressColor(report.luck_score)} p-1`}>
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950/90 text-white">
                        <div>
                          <span className="block text-5xl font-semibold">{report.luck_score}</span>
                          <span className="text-sm text-slate-300">Luck Score</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300">{report.daily_message}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
                      <p className="text-sm uppercase tracking-[0.3em] text-sky-200/80">Zodiac</p>
                      <h2 className="mt-3 text-3xl font-semibold text-white">{report.zodiac}</h2>
                      <p className="mt-3 text-slate-300">{report.personality}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
                        <p className="text-sm uppercase tracking-[0.3em] text-amber-200/80">Energy</p>
                        <p className="mt-3 text-3xl font-semibold text-white">{report.energy_level}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
                        <p className="text-sm uppercase tracking-[0.3em] text-violet-200/80">Lucky Color</p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="h-10 w-10 rounded-full" style={{ backgroundColor: report.lucky_color_hex }} />
                          <div>
                            <p className="text-xl font-semibold text-white">{report.lucky_color}</p>
                            <p className="text-slate-300">{report.lucky_color_hex}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Do’s for the day</p>
                    <ul className="mt-4 space-y-3 text-slate-200">
                      {report.dos.map((item) => (
                        <li key={item} className="rounded-2xl bg-slate-900/80 px-4 py-3">✔ {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-6">
                    <p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Don’ts for the day</p>
                    <ul className="mt-4 space-y-3 text-slate-200">
                      {report.donts.map((item) => (
                        <li key={item} className="rounded-2xl bg-slate-900/80 px-4 py-3">✖ {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-6" id="report-card">
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-200/80">Daily Guidance</p>
                  <p className="mt-4 text-slate-200">{report.message}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/20 transition hover:-translate-y-0.5"
                    onClick={handleShareImage}
                  >
                    Save result as image
                  </button>
                  <p className="text-sm text-slate-400">Your daily report is refreshed automatically each day with new cosmic energy.</p>
                </div>

                <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-6">
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-200/80">Compatibility checker</p>
                  <form className="mt-4 space-y-4" onSubmit={handleCompatibilitySubmit}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-3 rounded-3xl bg-slate-900/80 p-4">
                        <p className="font-semibold text-white">You</p>
                        <input
                          value={compatibilityForm.user_a.first_name}
                          onChange={(event) => setCompatibilityForm((current) => ({
                            ...current,
                            user_a: { ...current.user_a, first_name: event.target.value },
                          }))}
                          placeholder="First name"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100"
                        />
                        <input
                          value={compatibilityForm.user_a.last_name}
                          onChange={(event) => setCompatibilityForm((current) => ({
                            ...current,
                            user_a: { ...current.user_a, last_name: event.target.value },
                          }))}
                          placeholder="Last name"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100"
                        />
                        <input
                          type="date"
                          value={compatibilityForm.user_a.dob}
                          onChange={(event) => setCompatibilityForm((current) => ({
                            ...current,
                            user_a: { ...current.user_a, dob: event.target.value },
                          }))}
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100"
                        />
                      </div>
                      <div className="space-y-3 rounded-3xl bg-slate-900/80 p-4">
                        <p className="font-semibold text-white">Partner</p>
                        <input
                          value={compatibilityForm.user_b.first_name}
                          onChange={(event) => setCompatibilityForm((current) => ({
                            ...current,
                            user_b: { ...current.user_b, first_name: event.target.value },
                          }))}
                          placeholder="First name"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100"
                        />
                        <input
                          value={compatibilityForm.user_b.last_name}
                          onChange={(event) => setCompatibilityForm((current) => ({
                            ...current,
                            user_b: { ...current.user_b, last_name: event.target.value },
                          }))}
                          placeholder="Last name"
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100"
                        />
                        <input
                          type="date"
                          value={compatibilityForm.user_b.dob}
                          onChange={(event) => setCompatibilityForm((current) => ({
                            ...current,
                            user_b: { ...current.user_b, dob: event.target.value },
                          }))}
                          className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="rounded-3xl bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-sky-500/20 transition hover:-translate-y-0.5"
                      disabled={compatibilityLoading}
                    >
                      {compatibilityLoading ? 'Checking...' : 'Check compatibility'}
                    </button>
                  </form>

                  {compatibility ? (
                    <div className="mt-4 rounded-3xl bg-slate-900/80 p-4 text-slate-100">
                      <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">{compatibility.compatibility}</p>
                      <p className="mt-2 text-lg font-semibold">Match score: {compatibility.match_score}</p>
                      <p className="mt-3 text-slate-300">{compatibility.summary}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-white/5 p-8 text-center text-slate-300 shadow-glass backdrop-blur-xl">
                <p className="text-lg font-semibold text-white">Your personalized astrology report appears here.</p>
                <p className="mt-3 text-slate-400">Submit your details to see your luck score, recommendations, and color energy.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
