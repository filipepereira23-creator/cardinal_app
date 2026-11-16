import { Icon } from '../components/Icon';

const PAGES: Record<string, { title: string; body: string }> = {
  about: { title: 'About Cardinal', body: 'Cardinal shows everything you own in one number, and how it moves over time. This page is a placeholder.' },
  privacy: { title: 'Privacy', body: 'Our privacy policy will live here. Today, everything you enter stays in this browser on this device. This page is a placeholder.' },
  terms: { title: 'Terms', body: 'Our terms of use will live here. This page is a placeholder.' },
  contact: { title: 'Contact', body: 'A contact address will live here soon. This page is a placeholder.' },
};

export function InfoPage({ id }: { id?: string }) {
  const p = PAGES[id ?? ''] ?? PAGES.about;
  return (
    <div className="page">
      <button className="back" onClick={() => history.length > 1 ? history.back() : (location.hash = '#/')}><Icon name="back" size={18} /> Back</button>
      <section className="card info-card">
        <h1>{p.title}</h1>
        <p className="muted">{p.body}</p>
      </section>
    </div>
  );
}
