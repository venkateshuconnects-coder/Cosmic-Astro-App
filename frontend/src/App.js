import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
const DEFAULT_COUNTRIES = ['Auto-detect', 'United States', 'Canada', 'United Kingdom', 'India', 'Australia', 'Brazil', 'Japan'];
const progressColor = (score) => {
    if (score >= 70)
        return 'from-emerald-400 to-lime-400';
    if (score >= 40)
        return 'from-amber-400 to-orange-500';
    return 'from-rose-400 to-red-500';
};
const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
function App() {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        dob: '',
        country: 'Auto-detect',
    });
    const [report, setReport] = useState(null);
    const [history, setHistory] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [compatibilityForm, setCompatibilityForm] = useState({
        user_a: { first_name: '', last_name: '', dob: '', country: 'United States' },
        user_b: { first_name: '', last_name: '', dob: '', country: 'United States' },
    });
    const [compatibility, setCompatibility] = useState(null);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [compatibilityLoading, setCompatibilityLoading] = useState(false);
    const [error, setError] = useState('');
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
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
        if (form.country !== 'Auto-detect')
            return;
        const locale = navigator.language || 'en-US';
        const countryCode = locale.split('-')[1] || 'US';
        setForm((current) => ({ ...current, country: countryCode === 'US' ? 'United States' : countryCode }));
    }, []);
    const canSubmit = useMemo(() => Boolean(form.first_name.trim() && form.last_name.trim() && form.dob), [form]);
    const handleChange = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };
    const authHeaders = () => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    };
    const refreshSession = async (savedToken) => {
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
        }
        catch (err) {
            handleLogout();
        }
        finally {
            setSessionLoading(false);
        }
    };
    const handleHistoryFetch = async (firstName, lastName) => {
        setHistoryLoading(true);
        try {
            const query = new URLSearchParams();
            if (firstName)
                query.set('first_name', firstName);
            if (lastName)
                query.set('last_name', lastName);
            const response = await fetch(`${API_URL}/history?${query.toString()}`, {
                headers: authHeaders(),
            });
            if (!response.ok)
                throw new Error('Unable to load history.');
            const data = await response.json();
            setHistory(data);
            setSelectedReport(data.length ? data[0] : null);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setHistoryLoading(false);
        }
    };
    const handleSelectReport = (reportItem) => {
        setSelectedReport(reportItem);
    };
    useEffect(() => {
        if (report) {
            handleHistoryFetch(form.first_name, form.last_name);
        }
    }, [report]);
    const handleSubmit = async (event) => {
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
            if (!response.ok)
                throw new Error('Unable to generate report.');
            const data = await response.json();
            setReport(data);
        }
        catch (err) {
            setError('Failed to fetch astrology report. Make sure the backend is running on port 8000.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCompatibilitySubmit = async (event) => {
        event.preventDefault();
        setCompatibilityLoading(true);
        try {
            const response = await fetch(`${API_URL}/compatibility-check`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify(compatibilityForm),
            });
            if (!response.ok)
                throw new Error('Unable to calculate compatibility.');
            const data = await response.json();
            setCompatibility(data);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setCompatibilityLoading(false);
        }
    };
    const handleShareImage = async () => {
        const element = document.getElementById('report-card');
        if (!element)
            return;
        const canvas = await html2canvas(element, { backgroundColor: '#050816' });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `cosmic-astro-report-${form.first_name}-${form.last_name}.png`;
        link.click();
    };
    const handleAuthResponse = (tokenValue, userInfo) => {
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
    const handleRegister = async (event) => {
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
        }
        catch (err) {
            setAuthError(err.message);
        }
        finally {
            setAuthLoading(false);
        }
    };
    const handleLogin = async (event) => {
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
        }
        catch (err) {
            setAuthError(err.message);
        }
        finally {
            setAuthLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-cosmic-radial text-slate-100", children: _jsxs("div", { className: "mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 lg:px-10", children: [_jsx("header", { className: "mb-8 rounded-3xl bg-white/5 p-6 shadow-glass backdrop-blur-xl", children: _jsxs("div", { className: "max-w-4xl", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.35em] text-sky-200/70", children: "Cosmic Astrology" }), _jsx("h1", { className: "mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl", children: "Personalized daily insights crafted from your stars." }), _jsx("p", { className: "mt-4 max-w-2xl text-slate-300", children: "Enter your details to reveal your zodiac mood, luck score, daily guidance, and color energy for the day." })] }) }), _jsxs("main", { className: "grid gap-8 lg:grid-cols-[420px_1fr]", children: [_jsxs("section", { className: "space-y-6 rounded-3xl bg-white/10 p-6 shadow-glass backdrop-blur-xl", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("h2", { className: "text-2xl font-semibold text-white", children: "Your cosmic profile" }), _jsx("p", { className: "text-slate-300", children: "Fill in your name, date of birth, and location to receive a daily astrology report." })] }), _jsxs("form", { className: "space-y-5", onSubmit: handleSubmit, children: [_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200", children: "First Name" }), _jsx("input", { className: "w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20", placeholder: "Ariana", value: form.first_name, onChange: (event) => handleChange('first_name', event.target.value) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Last Name" }), _jsx("input", { className: "w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20", placeholder: "Star", value: form.last_name, onChange: (event) => handleChange('last_name', event.target.value) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Date of Birth" }), _jsx("input", { type: "date", className: "w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20", value: form.dob, onChange: (event) => handleChange('dob', event.target.value) })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Country" }), _jsx("select", { className: "w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20", value: form.country, onChange: (event) => handleChange('country', event.target.value), children: DEFAULT_COUNTRIES.map((country) => (_jsx("option", { value: country, children: country }, country))) })] }), error ? _jsx("p", { className: "text-sm text-rose-300", children: error }) : null, _jsx("button", { type: "submit", className: "inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-violet-500 to-sky-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60", disabled: loading, children: loading ? 'Creating your report...' : 'Generate my report' })] }), _jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-6", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-sky-200/80", children: "Account" }), _jsx("p", { className: "mt-2 text-slate-300", children: "Save reports to your profile and access your personal history." })] }), user ? (_jsx("button", { type: "button", className: "rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800", onClick: handleLogout, children: "Logout" })) : null] }), user ? (_jsxs("div", { className: "space-y-3 rounded-3xl bg-slate-900/90 p-4 text-slate-100", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-cyan-200/80", children: "Welcome back" }), _jsx("p", { className: "font-semibold text-white", children: user.first_name }), _jsx("p", { className: "text-sm text-slate-400", children: "Your saved astrology reports are ready. Tap any report below to view full details." })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-3", children: [_jsx("button", { type: "button", className: `rounded-3xl px-4 py-2 text-sm font-semibold ${authMode === 'login' ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-300'}`, onClick: () => setAuthMode('login'), children: "Login" }), _jsx("button", { type: "button", className: `rounded-3xl px-4 py-2 text-sm font-semibold ${authMode === 'register' ? 'bg-slate-800 text-white' : 'bg-slate-900 text-slate-300'}`, onClick: () => setAuthMode('register'), children: "Register" })] }), _jsxs("form", { className: "space-y-4", onSubmit: authMode === 'login' ? handleLogin : handleRegister, children: [_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Email" }), _jsx("input", { type: "email", className: "w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20", value: email, onChange: (event) => setEmail(event.target.value), placeholder: "you@example.com" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Password" }), _jsx("input", { type: "password", className: "w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20", value: password, onChange: (event) => setPassword(event.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), authMode === 'register' ? (_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Confirm Password" }), _jsx("input", { type: "password", className: "w-full rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-slate-100 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20", value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] })) : null, authError ? _jsx("p", { className: "text-sm text-rose-300", children: authError }) : null, _jsx("button", { type: "submit", className: "inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60", disabled: authLoading, children: authLoading ? 'Working…' : authMode === 'login' ? 'Login' : 'Register' })] })] }))] }), _jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-6", children: [_jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-slate-400", children: user ? 'My Reports' : 'History' }), _jsx("p", { className: "mt-2 text-slate-300", children: user ? 'Saved reports for your account.' : 'Recent reports for this name.' })] }), _jsx("button", { type: "button", className: "rounded-3xl bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800", onClick: () => handleHistoryFetch(form.first_name, form.last_name), children: "Refresh" })] }), _jsx("div", { className: "mt-4 space-y-3", children: historyLoading ? (_jsx("p", { className: "text-slate-400", children: "Loading history..." })) : history.length ? (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "grid gap-3", children: history.slice(0, 3).map((item) => (_jsxs("button", { type: "button", onClick: () => handleSelectReport(item), className: `w-full rounded-3xl border p-4 text-left transition ${selectedReport?.id === item.id ? 'border-cyan-400 bg-slate-800/90' : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'}`, children: [_jsxs("p", { className: "text-sm text-slate-300", children: [item.created_at.slice(0, 10), " \u00B7 ", item.dob] }), _jsxs("p", { className: "mt-2 text-white", children: [item.zodiac, " \u00B7 Luck ", item.luck_score] }), _jsx("p", { className: "mt-2 text-slate-400", children: item.country })] }, item.id))) }), selectedReport ? (_jsxs("div", { className: "rounded-3xl bg-slate-900/80 p-4", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-emerald-200/80", children: "Selected report" }), _jsxs("p", { className: "mt-3 text-lg font-semibold text-white", children: [selectedReport.first_name, " ", selectedReport.last_name, " \u00B7 ", selectedReport.zodiac] }), _jsxs("p", { className: "mt-2 text-slate-400", children: ["Born ", selectedReport.dob, " in ", selectedReport.country] }), _jsxs("div", { className: "mt-4 grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-3xl bg-slate-950/80 p-4", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-sky-200/80", children: "Energy" }), _jsx("p", { className: "mt-2 text-white", children: selectedReport.energy_level })] }), _jsxs("div", { className: "rounded-3xl bg-slate-950/80 p-4", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-amber-200/80", children: "Lucky color" }), _jsxs("div", { className: "mt-2 flex items-center gap-3", children: [_jsx("span", { className: "h-9 w-9 rounded-full", style: { backgroundColor: selectedReport.lucky_color_hex } }), _jsx("span", { className: "text-white", children: selectedReport.lucky_color })] })] })] }), _jsxs("div", { className: "mt-4 grid gap-3", children: [_jsxs("div", { className: "rounded-3xl bg-slate-950/80 p-4", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-emerald-200/80", children: "Do\u2019s" }), _jsx("ul", { className: "mt-3 space-y-2 text-slate-200", children: selectedReport.dos.map((item) => (_jsxs("li", { children: ["\u2714 ", item] }, item))) })] }), _jsxs("div", { className: "rounded-3xl bg-slate-950/80 p-4", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-rose-200/80", children: "Don\u2019ts" }), _jsx("ul", { className: "mt-3 space-y-2 text-slate-200", children: selectedReport.donts.map((item) => (_jsxs("li", { children: ["\u2716 ", item] }, item))) })] })] })] })) : null] })) : (_jsx("p", { className: "text-slate-400", children: user ? 'No saved reports yet. Generate a report to add one.' : 'Submit a report to populate saved history.' })) })] })] }), _jsx("section", { className: "space-y-6", children: report ? (_jsxs("div", { className: "space-y-6 rounded-3xl bg-white/10 p-6 shadow-glass backdrop-blur-xl", children: [_jsxs("div", { className: "grid gap-6 lg:grid-cols-[280px_1fr]", children: [_jsxs("div", { className: "rounded-3xl bg-slate-950/70 p-6 text-center shadow-xl shadow-slate-950/20", children: [_jsx("div", { className: `mx-auto mb-6 h-40 w-40 rounded-full bg-gradient-to-br ${progressColor(report.luck_score)} p-1`, children: _jsx("div", { className: "flex h-full w-full items-center justify-center rounded-full bg-slate-950/90 text-white", children: _jsxs("div", { children: [_jsx("span", { className: "block text-5xl font-semibold", children: report.luck_score }), _jsx("span", { className: "text-sm text-slate-300", children: "Luck Score" })] }) }) }), _jsx("p", { className: "text-slate-300", children: report.daily_message })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-5", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-sky-200/80", children: "Zodiac" }), _jsx("h2", { className: "mt-3 text-3xl font-semibold text-white", children: report.zodiac }), _jsx("p", { className: "mt-3 text-slate-300", children: report.personality })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-5", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-amber-200/80", children: "Energy" }), _jsx("p", { className: "mt-3 text-3xl font-semibold text-white", children: report.energy_level })] }), _jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-5", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-violet-200/80", children: "Lucky Color" }), _jsxs("div", { className: "mt-3 flex items-center gap-3", children: [_jsx("span", { className: "h-10 w-10 rounded-full", style: { backgroundColor: report.lucky_color_hex } }), _jsxs("div", { children: [_jsx("p", { className: "text-xl font-semibold text-white", children: report.lucky_color }), _jsx("p", { className: "text-slate-300", children: report.lucky_color_hex })] })] })] })] })] })] }), _jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-6", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-emerald-200/80", children: "Do\u2019s for the day" }), _jsx("ul", { className: "mt-4 space-y-3 text-slate-200", children: report.dos.map((item) => (_jsxs("li", { className: "rounded-2xl bg-slate-900/80 px-4 py-3", children: ["\u2714 ", item] }, item))) })] }), _jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-6", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-rose-200/80", children: "Don\u2019ts for the day" }), _jsx("ul", { className: "mt-4 space-y-3 text-slate-200", children: report.donts.map((item) => (_jsxs("li", { className: "rounded-2xl bg-slate-900/80 px-4 py-3", children: ["\u2716 ", item] }, item))) })] })] }), _jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-6", id: "report-card", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-sky-200/80", children: "Daily Guidance" }), _jsx("p", { className: "mt-4 text-slate-200", children: report.message })] }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsx("button", { type: "button", className: "inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-fuchsia-500/20 transition hover:-translate-y-0.5", onClick: handleShareImage, children: "Save result as image" }), _jsx("p", { className: "text-sm text-slate-400", children: "Your daily report is refreshed automatically each day with new cosmic energy." })] }), _jsxs("div", { className: "rounded-3xl border border-slate-700 bg-slate-950/70 p-6", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-sky-200/80", children: "Compatibility checker" }), _jsxs("form", { className: "mt-4 space-y-4", onSubmit: handleCompatibilitySubmit, children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "space-y-3 rounded-3xl bg-slate-900/80 p-4", children: [_jsx("p", { className: "font-semibold text-white", children: "You" }), _jsx("input", { value: compatibilityForm.user_a.first_name, onChange: (event) => setCompatibilityForm((current) => ({
                                                                            ...current,
                                                                            user_a: { ...current.user_a, first_name: event.target.value },
                                                                        })), placeholder: "First name", className: "w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100" }), _jsx("input", { value: compatibilityForm.user_a.last_name, onChange: (event) => setCompatibilityForm((current) => ({
                                                                            ...current,
                                                                            user_a: { ...current.user_a, last_name: event.target.value },
                                                                        })), placeholder: "Last name", className: "w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100" }), _jsx("input", { type: "date", value: compatibilityForm.user_a.dob, onChange: (event) => setCompatibilityForm((current) => ({
                                                                            ...current,
                                                                            user_a: { ...current.user_a, dob: event.target.value },
                                                                        })), className: "w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100" })] }), _jsxs("div", { className: "space-y-3 rounded-3xl bg-slate-900/80 p-4", children: [_jsx("p", { className: "font-semibold text-white", children: "Partner" }), _jsx("input", { value: compatibilityForm.user_b.first_name, onChange: (event) => setCompatibilityForm((current) => ({
                                                                            ...current,
                                                                            user_b: { ...current.user_b, first_name: event.target.value },
                                                                        })), placeholder: "First name", className: "w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100" }), _jsx("input", { value: compatibilityForm.user_b.last_name, onChange: (event) => setCompatibilityForm((current) => ({
                                                                            ...current,
                                                                            user_b: { ...current.user_b, last_name: event.target.value },
                                                                        })), placeholder: "Last name", className: "w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100" }), _jsx("input", { type: "date", value: compatibilityForm.user_b.dob, onChange: (event) => setCompatibilityForm((current) => ({
                                                                            ...current,
                                                                            user_b: { ...current.user_b, dob: event.target.value },
                                                                        })), className: "w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-slate-100" })] })] }), _jsx("button", { type: "submit", className: "rounded-3xl bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-sky-500/20 transition hover:-translate-y-0.5", disabled: compatibilityLoading, children: compatibilityLoading ? 'Checking...' : 'Check compatibility' })] }), compatibility ? (_jsxs("div", { className: "mt-4 rounded-3xl bg-slate-900/80 p-4 text-slate-100", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.3em] text-cyan-200/80", children: compatibility.compatibility }), _jsxs("p", { className: "mt-2 text-lg font-semibold", children: ["Match score: ", compatibility.match_score] }), _jsx("p", { className: "mt-3 text-slate-300", children: compatibility.summary })] })) : null] })] })) : (_jsxs("div", { className: "rounded-3xl border border-dashed border-slate-700 bg-white/5 p-8 text-center text-slate-300 shadow-glass backdrop-blur-xl", children: [_jsx("p", { className: "text-lg font-semibold text-white", children: "Your personalized astrology report appears here." }), _jsx("p", { className: "mt-3 text-slate-400", children: "Submit your details to see your luck score, recommendations, and color energy." })] })) })] })] }) }));
}
export default App;
//# sourceMappingURL=App.js.map