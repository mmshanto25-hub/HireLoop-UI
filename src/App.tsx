import { useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getGetCompanyQueryKey,
  getGetJobQueryKey,
  getGetMarketplaceSummaryQueryKey,
  getListCompaniesQueryKey,
  getListJobsQueryKey,
  useGetCompany,
  useGetJob,
  useGetMarketplaceSummary,
  useListCompanies,
  useListJobs,
} from '@workspace/api-client-react';
import type { Company, Job, ListJobsParams } from '@workspace/api-client-react';
import { ArrowDownRight, ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Check, ChevronDown, Clock3, Globe2, MapPin, Search, SlidersHorizontal, Users, X } from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <div className="container-wide nav-inner">
      <Link href="/" className="brand" aria-label="HireLoop home"><span className="brand-symbol"><span /></span><span>hireloop</span></Link>
      <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
        <Link href="/jobs" className="nav-link" onClick={() => setMenuOpen(false)}>Find a job</Link>
        <Link href="/companies" className="nav-link" onClick={() => setMenuOpen(false)}>Companies</Link>
        <Link href="/pricing" className="nav-link" onClick={() => setMenuOpen(false)}>For employers</Link>
        <Link href="/about" className="nav-link mobile-about" onClick={() => setMenuOpen(false)}>About us</Link>
      </nav>
      <div className="nav-actions"><Link href="/jobs" className="nav-cta">Explore roles <ArrowRight size={15} /></Link>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} data-testid="button-menu"><span /><span /></button>
      </div>
    </div>
  </header>;
}

function Footer() {
  return <footer className="site-footer"><div className="container-wide">
    <div className="footer-top">
      <div className="footer-brand"><Link href="/" className="brand"><span className="brand-symbol"><span /></span><span>hireloop</span></Link><p>Good work starts with a better match.</p></div>
      <div className="footer-links"><div><span className="footer-label">Explore</span><Link href="/jobs">Open roles</Link><Link href="/companies">Companies</Link><Link href="/pricing">For employers</Link></div><div><span className="footer-label">HireLoop</span><Link href="/about">About us</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} HireLoop</span><span>Sample listings and company profiles for demonstration.</span></div>
  </div></footer>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <div className="app-shell"><Header /><main key={location} className="page-enter">{children}</main><Footer /></div>;
}

function SectionHeading({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return <div className="section-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{body && <p>{body}</p>}</div>{action}</div>;
}

function SkeletonRows({ count = 3 }: { count?: number }) {
  return <div className="job-list" aria-label="Loading jobs">{Array.from({ length: count }, (_, i) => <div className="job-skeleton" key={i}><div className="skeleton sk-logo" /><div className="sk-copy"><div className="skeleton sk-line wide" /><div className="skeleton sk-line" /><div className="skeleton sk-line short" /></div></div>)}</div>;
}

function DataMessage({ title, description, retry }: { title: string; description: string; retry?: () => void }) {
  return <div className="data-message" role="status"><div className="message-mark"><ArrowDownRight size={20} /></div><h3>{title}</h3><p>{description}</p>{retry && <button className="button button-outline" type="button" onClick={retry}>Try again</button>}</div>;
}

function CompanyMark({ company, large = false }: { company: Pick<Company, 'name' | 'logo'>; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = company.name.split(/\s+/).slice(0, 2).map(v => v[0]).join('').toUpperCase();
  return <span className={`company-mark ${large ? 'company-mark-lg' : ''}`} aria-label={`${company.name} logo`}>{company.logo && !imageFailed ? <img src={company.logo} alt="" onError={() => setImageFailed(true)} /> : initials}</span>;
}

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null;
  const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: job.currency || 'USD', maximumFractionDigits: 0, notation: n >= 100000 ? 'compact' : 'standard' }).format(n);
  return `${job.salaryMin ? fmt(job.salaryMin) : ''}${job.salaryMin && job.salaryMax ? ' – ' : ''}${job.salaryMax ? fmt(job.salaryMax) : ''}${job.salaryPeriod ? ` / ${job.salaryPeriod}` : ''}`;
}

function JobCard({ job, compact = false }: { job: Job; compact?: boolean }) {
  return <article className={`job-card ${compact ? 'job-card-compact' : ''}`} data-testid={`card-job-${job.id}`}>
    <Link href={`/jobs/${job.id}`} className="job-card-main">
      <CompanyMark company={job.company} />
      <div className="job-copy"><div className="job-company">{job.company.name}{job.featured && <span className="featured-label"><span />Featured</span>}</div><h3>{job.title}</h3>
        <div className="job-meta"><span><MapPin size={14} />{job.remote ? 'Remote' : job.location}</span><span><BriefcaseBusiness size={14} />{job.type.replace('-', ' ')}</span>{formatSalary(job) && <span className="salary">{formatSalary(job)}</span>}</div>
      </div><ArrowRight className="job-arrow" size={18} aria-hidden="true" />
    </Link>
    {!compact && <div className="job-card-bottom"><span className="category-chip">{job.category}</span><span className="published"><Clock3 size={13} />{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'Recently posted'}</span></div>}
  </article>;
}

function CompanyCard({ company }: { company: Company }) {
  return <Link href={`/companies/${company.slug}`} className="company-card" data-testid={`card-company-${company.id}`}>
    <div className="company-card-top"><CompanyMark company={company} large /><span className="open-role-count">{company.openJobs} open {company.openJobs === 1 ? 'role' : 'roles'} <ArrowRight size={14} /></span></div>
    <h3>{company.name}</h3><p>{company.industry}</p><div className="company-location"><MapPin size={14} />{company.location}</div>
  </Link>;
}

function Home() {
  const [, setLocation] = useLocation();
  const summary = useGetMarketplaceSummary({ query: { queryKey: getGetMarketplaceSummaryQueryKey() } });
  const params: ListJobsParams = { page: 1, pageSize: 4, sort: 'newest' };
  const jobs = useListJobs(params, { query: { queryKey: getListJobsQueryKey(params) } });
  const companies = useListCompanies(undefined, { query: { queryKey: getListCompaniesQueryKey() } });
  const jobItems = Array.isArray(jobs.data?.items) ? jobs.data.items : null;
  const featuredCompanies = Array.isArray(companies.data) ? companies.data.slice(0, 4) : [];
  return <>
    <section className="hero"><div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="container-wide hero-inner">
      <div className="hero-copy"><div className="eyebrow hero-eyebrow"><span className="live-dot" />Demo marketplace · sample listings</div><h1>Find work that<br /><em>feels like you.</em></h1><p>Meet teams building thoughtful things, and find a role where your next chapter can take shape.</p>
        <form className="hero-search" action="/jobs" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); setLocation(`/jobs?q=${encodeURIComponent(String(data.get('q') || ''))}&location=${encodeURIComponent(String(data.get('location') || ''))}`); }}>
          <label className="search-field"><Search size={18} /><span className="sr-only">Role or keyword</span><input name="q" placeholder="Role, skill, or company" data-testid="input-home-query" /></label><span className="search-divider" />
          <label className="search-field location-field"><MapPin size={18} /><span className="sr-only">Location</span><input name="location" placeholder="Anywhere" data-testid="input-home-location" /></label>
          <button className="button button-primary search-submit" type="submit">Explore jobs <ArrowRight size={16} /></button>
        </form>
        <div className="hero-footnote"><span className="avatar-stack"><i>J</i><i>M</i><i>A</i></span><span>For people and teams doing work that matters.</span></div>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="art-ring ring-a" /><div className="art-ring ring-b" /><div className="art-sun" /><div className="art-note note-top"><span className="note-mark">HL</span><span><b>Better work,</b><small>within reach</small></span></div><div className="art-note note-bottom"><span className="note-check"><Check size={17} /></span><span><b>A fresh start</b><small>could be one click away</small></span></div><div className="art-stem" /><div className="art-leaf leaf-a" /><div className="art-leaf leaf-b" /></div>
    </div></section>
    <section className="market-stats"><div className="container-wide stats-inner"><div><strong>{summary.data?.activeJobs?.toLocaleString() ?? '—'}</strong><span>sample open roles</span></div><div><strong>{summary.data?.approvedCompanies?.toLocaleString() ?? '—'}</strong><span>sample companies</span></div><div className="stats-note"><span className="live-dot" />Demonstration data · not live marketplace activity.</div></div></section>
    <section className="section-block container-wide"><SectionHeading eyebrow="Start somewhere" title="A good next step starts here." body="Browse roles from teams that care about the work and the people doing it." action={<Link href="/jobs" className="text-link">See all roles <ArrowRight size={16} /></Link>} />
      {jobs.isLoading ? <SkeletonRows count={4} /> : jobs.isError || (jobs.data !== undefined && !jobItems) ? <DataMessage title="Roles are taking a moment." description="We couldn't load current openings just now." retry={() => jobs.refetch()} /> : jobItems?.length ? <div className="job-list">{jobItems.map(job => <JobCard key={job.id} job={job} />)}</div> : <DataMessage title="New roles are on their way." description="Check back soon, or browse teams already on HireLoop." />}
    </section>
    <section className="category-band"><div className="container-wide"><SectionHeading eyebrow="Follow your curiosity" title="Explore by field" body="A few places to begin. Your next role might surprise you." /><div className="category-grid">{(summary.data?.categories || []).slice(0, 6).map((item, i) => <Link key={item.name} href={`/jobs?category=${encodeURIComponent(item.name)}`} className={`category-tile category-${i % 6}`}><span className="category-number">0{i + 1}</span><strong>{item.name}</strong><span className="category-count">{item.count} roles <ArrowRight size={15} /></span></Link>)}
      {!summary.data?.categories?.length && <Link href="/jobs" className="category-tile category-0"><span className="category-number">01</span><strong>Every possibility</strong><span className="category-count">Browse open roles <ArrowRight size={15} /></span></Link>}</div></div></section>
    <section className="section-block container-wide"><SectionHeading eyebrow="Good people, good work" title="Meet the teams behind the roles." body="Get to know the companies making room for what's next." action={<Link href="/companies" className="text-link">Browse companies <ArrowRight size={16} /></Link>} />
      {companies.isLoading ? <div className="company-grid">{[1,2,3,4].map(n => <div className="company-skeleton" key={n}><div className="skeleton sk-logo" /><div className="skeleton sk-line wide" /></div>)}</div> : companies.isError || (companies.data !== undefined && !Array.isArray(companies.data)) ? <DataMessage title="Company profiles aren't available right now." description="Please try again in a little while." retry={() => companies.refetch()} /> : featuredCompanies.length ? <div className="company-grid">{featuredCompanies.map(company => <CompanyCard key={company.id} company={company} />)}</div> : <DataMessage title="The directory is growing." description="There are no company profiles to show just yet." />}
    </section>
    <section className="home-closer"><div className="container-wide closer-inner"><div><div className="eyebrow">For the people building teams</div><h2>Find your next<br /><em>great colleague.</em></h2><p>Put your company in front of people looking for work with purpose.</p></div><Link href="/pricing" className="button button-cream">Explore employer plans <ArrowRight size={16} /></Link><span className="closer-decoration" aria-hidden="true">H</span></div></section>
  </>;
}

function JobsPage() {
  const initial = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(initial.get('q') || '');
  const [location, setLocation] = useState(initial.get('location') || '');
  const [category, setCategory] = useState(initial.get('category') || '');
  const [type, setType] = useState('');
  const [remote, setRemote] = useState(false);
  const [sort, setSort] = useState<'newest' | 'salary'>('newest');
  const [page, setPage] = useState(1);
  const summary = useGetMarketplaceSummary({ query: { queryKey: getGetMarketplaceSummaryQueryKey() } });
  const params: ListJobsParams = { q: query.trim() || undefined, location: location.trim() || undefined, category: category || undefined, type: type || undefined, remote: remote || undefined, sort, page, pageSize: 10 };
  const result = useListJobs(params, { query: { queryKey: getListJobsQueryKey(params), placeholderData: previous => previous } });
  const submit = (event: FormEvent) => { event.preventDefault(); setPage(1); };
  const reset = () => { setQuery(''); setLocation(''); setCategory(''); setType(''); setRemote(false); setPage(1); };
  return <div className="container-wide inner-page">
    <div className="page-intro"><div className="eyebrow">The open-role board</div><h1>Work worth<br /><em>looking for.</em></h1><p>Find a role that fits the way you want to work and the things you want to make.</p></div>
    <form className="filter-bar" onSubmit={submit}><label className="filter-input"><Search size={17} /><span className="sr-only">Search roles</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Title, skill, or company" data-testid="input-jobs-query" /></label>
      <label className="filter-input"><MapPin size={17} /><span className="sr-only">Filter by location</span><input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" data-testid="input-jobs-location" /></label>
      <label className="select-wrap"><span className="sr-only">Category</span><select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} aria-label="Category" data-testid="select-job-category"><option value="">All categories</option>{(summary.data?.categories || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}</select><ChevronDown size={15} /></label>
      <button className="button button-primary filter-submit" type="submit"><Search size={16} /><span>Search</span></button>
    </form>
    <div className="results-layout"><aside className="filter-sidebar"><div className="filter-sidebar-heading"><SlidersHorizontal size={16} /><strong>Refine results</strong></div>
      <div className="filter-group"><label className="filter-label" htmlFor="type-filter">Employment type</label><div className="select-wrap full"><select id="type-filter" value={type} onChange={e => { setType(e.target.value); setPage(1); }} data-testid="select-job-type"><option value="">Any type</option><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="internship">Internship</option></select><ChevronDown size={15} /></div></div>
      <label className="check-filter"><input type="checkbox" checked={remote} onChange={e => { setRemote(e.target.checked); setPage(1); }} data-testid="checkbox-remote" /><span className="custom-check"><Check size={12} /></span><span>Remote-friendly</span></label>
      <div className="filter-group"><span className="filter-label">Sort by</span><div className="sort-choice"><button type="button" className={sort === 'newest' ? 'sort-active' : ''} onClick={() => setSort('newest')}>Newest</button><button type="button" className={sort === 'salary' ? 'sort-active' : ''} onClick={() => setSort('salary')}>Salary</button></div></div>
      {(query || location || category || type || remote) && <button className="clear-filters" type="button" onClick={reset}><X size={14} /> Clear all filters</button>}
    </aside>
    <section className="results-main" aria-label="Job search results"><div className="results-heading"><div><span className="eyebrow">Open roles</span><h2>{result.data ? result.data.total.toLocaleString() : '—'} opportunities</h2></div><span className="results-page">Page {result.data?.page || page}{result.data?.totalPages ? ` of ${result.data.totalPages}` : ''}</span></div>
      {result.isLoading ? <SkeletonRows count={5} /> : result.isError ? <DataMessage title="Couldn't load these roles." description="Check your connection and give it another try." retry={() => result.refetch()} /> : result.data?.items.length ? <><div className={result.isFetching ? 'job-list is-refreshing' : 'job-list'}>{result.data.items.map(job => <JobCard key={job.id} job={job} />)}</div>
        <div className="pagination"><span>Showing {((result.data.page - 1) * result.data.pageSize) + 1}–{Math.min(result.data.page * result.data.pageSize, result.data.total)} of {result.data.total}</span><div><button type="button" aria-label="Previous page" disabled={page <= 1 || result.isFetching} onClick={() => setPage(p => Math.max(1, p - 1))}><ArrowLeft size={16} /></button><button type="button" aria-label="Next page" disabled={page >= result.data.totalPages || result.isFetching} onClick={() => setPage(p => p + 1)}><ArrowRight size={16} /></button></div></div>
      </> : <DataMessage title="No roles found this time." description="Try widening your search or clearing a filter to see more opportunities." />}
    </section></div>
  </div>;
}

function JobDetailPage() {
  const { jobId = '' } = useParams<{ jobId: string }>();
  const jobQuery = useGetJob(jobId, { query: { enabled: Boolean(jobId), queryKey: getGetJobQueryKey(jobId) } });
  if (jobQuery.isLoading) return <div className="container-wide inner-page"><SkeletonRows count={2} /></div>;
  if (jobQuery.isError || !jobQuery.data) return <div className="container-wide inner-page"><Link href="/jobs" className="back-link"><ArrowLeft size={15} />All open roles</Link><DataMessage title="This role isn't available." description="It may have closed or the link may have changed." retry={() => jobQuery.refetch()} /></div>;
  const job = jobQuery.data;
  return <div className="container-wide detail-page"><Link href="/jobs" className="back-link"><ArrowLeft size={15} />All open roles</Link>
    <div className="detail-grid"><article className="detail-main"><div className="detail-company"><CompanyMark company={job.company} large /><div><Link href={`/companies/${job.company.slug}`} className="company-name-link">{job.company.name} <ArrowRight size={13} /></Link><div className="detail-sub">{job.category} · {job.type.replace('-', ' ')}</div></div></div>
      <h1>{job.title}</h1><div className="detail-tags"><span><MapPin size={15} />{job.remote ? 'Remote-friendly' : job.location}</span>{formatSalary(job) && <span>{formatSalary(job)}</span>}</div>
      <div className="detail-body"><section><h2>About the role</h2><p>{job.description}</p></section>{job.responsibilities.length > 0 && <section><h2>What you'll do</h2><ul>{job.responsibilities.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}{job.requirements.length > 0 && <section><h2>What you'll bring</h2><ul>{job.requirements.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}{job.benefits.length > 0 && <section><h2>Thoughtful benefits</h2><ul>{job.benefits.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}</div>
      <div className="apply-note"><span className="note-check"><Check size={17} /></span><p>Interested in this role? Visit <Link href={`/companies/${job.company.slug}`}>{job.company.name}'s profile</Link> to learn more about the team and find their public website.</p></div>
    </article><aside className="detail-aside"><div className="aside-card"><span className="eyebrow">Role overview</span><dl><div><dt>Workplace</dt><dd>{job.remote ? 'Remote-friendly' : job.location}</dd></div><div><dt>Employment</dt><dd>{job.type.replace('-', ' ')}</dd></div><div><dt>Field</dt><dd>{job.category}</dd></div>{formatSalary(job) && <div><dt>Compensation</dt><dd>{formatSalary(job)}</dd></div>}{job.deadline && <div><dt>Apply by</dt><dd>{new Date(job.deadline).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</dd></div>}</dl><Link href={`/companies/${job.company.slug}`} className="button button-primary full-button">About the company <ArrowRight size={16} /></Link></div><p className="aside-footnote"><Globe2 size={14} /> Public role listing · Posted {new Date(job.publishedAt).toLocaleDateString('en', { month: 'long', day: 'numeric' })}</p></aside></div>
  </div>;
}

function CompaniesPage() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const params = { q: search.trim() || undefined, industry: industry || undefined };
  const query = useListCompanies(params, { query: { queryKey: getListCompaniesQueryKey(params) } });
  const industries = Array.from(new Set(query.data?.map(company => company.industry) || []));
  return <div className="container-wide inner-page"><div className="page-intro short-intro"><div className="eyebrow">The people behind the work</div><h1>Meet your next<br /><em>kind of team.</em></h1><p>Get a feel for the places hiring, their focus, and the open roles they have today.</p></div>
    <div className="directory-tools"><label className="filter-input"><Search size={17} /><span className="sr-only">Search companies</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by company or industry" data-testid="input-company-search" /></label><label className="select-wrap"><span className="sr-only">Filter industry</span><select value={industry} onChange={e => setIndustry(e.target.value)} aria-label="Filter by industry" data-testid="select-company-industry"><option value="">Every industry</option>{industries.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label></div>
    <div className="directory-result-note">{query.data ? `${query.data.length} ${query.data.length === 1 ? 'company' : 'companies'} to get to know` : 'Company directory'}</div>
    {query.isLoading ? <div className="company-grid">{[1,2,3,4,5,6].map(n => <div className="company-skeleton" key={n}><div className="skeleton sk-logo" /><div className="skeleton sk-line wide" /></div>)}</div> : query.isError ? <DataMessage title="The directory couldn't load." description="Please try again in a moment." retry={() => query.refetch()} /> : query.data?.length ? <div className="company-grid">{query.data.map(company => <CompanyCard key={company.id} company={company} />)}</div> : <DataMessage title="No matching teams yet." description="Try another company name or industry." />}
  </div>;
}

function CompanyDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const query = useGetCompany(slug, { query: { enabled: Boolean(slug), queryKey: getGetCompanyQueryKey(slug) } });
  if (query.isLoading) return <div className="container-wide inner-page"><SkeletonRows count={3} /></div>;
  if (query.isError || !query.data) return <div className="container-wide inner-page"><Link href="/companies" className="back-link"><ArrowLeft size={15} />Company directory</Link><DataMessage title="Company profile not found." description="This profile may have moved or is no longer public." retry={() => query.refetch()} /></div>;
  const { company, jobs } = query.data;
  return <div className="container-wide detail-page"><Link href="/companies" className="back-link"><ArrowLeft size={15} />Company directory</Link><section className="company-profile-head"><CompanyMark company={company} large /><div className="profile-title"><div className="eyebrow">{company.industry}</div><h1>{company.name}</h1><div className="profile-meta"><span><MapPin size={15} />{company.location}</span><span><Users size={15} />{company.employeeRange} people</span>{company.website && <a href={company.website} target="_blank" rel="noreferrer"><Globe2 size={15} />Visit website <ArrowRight size={13} /></a>}</div></div><span className="profile-open">{company.openJobs} open {company.openJobs === 1 ? 'role' : 'roles'}</span></section>
    <div className="company-about"><div className="eyebrow">A little about them</div><p>{company.description}</p></div>
    <section className="company-openings"><SectionHeading eyebrow="The work ahead" title={`Open roles at ${company.name}`} body="See if there's a place for you on this team." />{jobs.length ? <div className="job-list">{jobs.map(job => <JobCard key={job.id} job={job} />)}</div> : <DataMessage title="No open roles at the moment." description="Check back later to see what this team is building next." />}</section>
  </div>;
}

function PricingPage() {
  return <div className="container-wide info-page"><div className="info-hero"><div className="eyebrow">For teams with good work to do</div><h1>Hiring should feel<br /><em>human, too.</em></h1><p>HireLoop brings thoughtful teams and people looking for meaningful work into the same place.</p></div>
    <section className="pricing-intro"><div><div className="eyebrow">Plans & access</div><h2>Clear options.<br />No surprises.</h2></div><p>Our marketplace is in its early days. Company profiles and public job listings are currently available as part of the HireLoop launch. Paid billing and self-serve employer tools are not yet available.</p></section>
    <div className="plan-grid"><article className="plan-card"><span className="plan-kicker">For candidates</span><h3>Explore</h3><p>Browse the marketplace and get to know companies hiring today.</p><ul><li><Check size={16} />Public job listings</li><li><Check size={16} />Company profiles</li><li><Check size={16} />Search and filters</li></ul><Link href="/jobs" className="button button-outline full-button">Explore open roles <ArrowRight size={16} /></Link></article>
       <article className="plan-card plan-featured"><span className="plan-kicker">For recruiting teams</span><span className="plan-tag">Early marketplace</span><h3>Company presence</h3><p>Give candidates a clear view of your team and the roles you're opening.</p><ul><li><Check size={16} />Public company profile</li><li><Check size={16} />Open role visibility</li><li><Check size={16} />No paid checkout yet</li></ul><Link href="/companies" className="button button-primary full-button">Browse companies <ArrowRight size={16} /></Link></article>
    </div><p className="pricing-footnote">No account, application, saved-job, or billing features are available in this public release.</p>
  </div>;
}

const infoContent: Record<string, { eyebrow: string; title: ReactNode; intro: string; sections: { title: string; text: string }[] }> = {
  about: { eyebrow: 'A different kind of job marketplace', title: <>Better work<br /><em>starts with people.</em></>, intro: 'HireLoop is a public marketplace for people exploring what comes next and teams looking for the right kind of colleague.', sections: [{ title: 'A clearer way to explore', text: 'A job search is a meaningful moment. We make it easier to understand the opportunity, the company, and the work before you take a next step.' }, { title: 'Good matches take care', text: 'We believe the best hiring starts with a thoughtful introduction. HireLoop brings open roles and company context together in one focused place.' }, { title: 'Built in the open', text: 'This public release is centered on job discovery and company profiles. Private accounts, applications, and billing are not currently available.' }] },
  contact: { eyebrow: 'Contact', title: <>A note is a<br /><em>good beginning.</em></>, intro: 'A public contact channel has not been configured for this HireLoop preview.', sections: [{ title: 'This is a demonstration', text: 'The job listings and company profiles on this site are sample content, not live openings or participating employers.' }, { title: 'No application is submitted', text: 'This preview does not support account sign-in, applications, resume uploads, or paid billing.' }, { title: 'Before launch', text: 'Add and verify a real contact channel and replace sample marketplace records before sharing HireLoop as a live service.' }] },
  privacy: { eyebrow: 'The essentials', title: <>Your privacy<br /><em>matters here.</em></>, intro: 'This is a public demonstration experience, not a production marketplace or formal privacy notice.', sections: [{ title: 'Sample marketplace data', text: 'Job listings and company profiles shown here are examples served from a demonstration database.' }, { title: 'Search and filters', text: 'Search terms and filters are sent to the marketplace API to find matching sample listings. This release does not accept account details, resumes, or applications.' }, { title: 'Before launch', text: 'A real privacy notice and verified contact channel must be configured before collecting personal information.' }] },
  terms: { eyebrow: 'Using HireLoop', title: <>A few things<br /><em>to know.</em></>, intro: 'These notes describe the limits of this demonstration marketplace.', sections: [{ title: 'Sample information', text: 'Listings, companies, and details on this site are demonstration content. They do not represent verified employers or current openings.' }, { title: 'No hiring actions', text: 'This preview does not support account sign-in, applications, saved jobs, resume uploads, private dashboards, or paid billing.' }, { title: 'Not a live service', text: 'Do not rely on the example listings or company information when making employment decisions.' }] }
};

function InfoPage({ page }: { page: keyof typeof infoContent }) {
  const content = infoContent[page];
  return <div className="container-wide info-page"><div className="info-hero"><div className="eyebrow">{content.eyebrow}</div><h1>{content.title}</h1><p>{content.intro}</p></div><div className="info-body">{content.sections.map((section, i) => <article key={section.title}><span className="info-index">0{i + 1}</span><div><h2>{section.title}</h2><p>{section.text}</p></div></article>)}</div>{page === 'about' && <div className="info-cta"><span>Ready to see what's out there?</span><Link href="/jobs" className="button button-primary">Browse open roles <ArrowRight size={16} /></Link></div>}</div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={Home} />
    <Route path="/jobs" component={JobsPage} />
    <Route path="/jobs/:jobId" component={JobDetailPage} />
    <Route path="/companies" component={CompaniesPage} />
    <Route path="/companies/:slug" component={CompanyDetailPage} />
    <Route path="/pricing" component={PricingPage} />
    <Route path="/about"><InfoPage page="about" /></Route>
    <Route path="/contact"><InfoPage page="contact" /></Route>
    <Route path="/privacy"><InfoPage page="privacy" /></Route>
    <Route path="/terms"><InfoPage page="terms" /></Route>
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Shell><Router /></Shell><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
