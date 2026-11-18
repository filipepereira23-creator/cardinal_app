import { Icon } from '../components/Icon';

interface Section { h: string; p: string[] }
interface Doc { title: string; updated?: string; intro: string; sections: Section[] }

const UPDATED = '18 November 2026';

const PAGES: Record<string, Doc> = {
  about: {
    title: 'About Cardinal',
    intro: 'Cardinal shows everything you own in one number, and how it moves over time. It is built for people who want to be considered with money without making a fuss about it.',
    sections: [
      { h: 'What it does', p: ['Add your bank accounts, ISAs, investments, pensions, crypto and the things you own, like watches, cars, property and gold. Cardinal adds it all up, charts it, and shows how far you have come on your net worth path.'] },
      { h: 'Read only by design', p: ['Cardinal never moves your money and never asks for your bank password. Live connections to banks will use regulated open banking, where you approve access with your bank and can stop it at any time.'] },
    ],
  },
  contact: {
    title: 'Contact',
    intro: 'A contact address for Cardinal will be published here soon.',
    sections: [{ h: 'In the meantime', p: ['If you were given access to Cardinal by the team, reply to the email you received from us.'] }],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: UPDATED,
    intro: 'This policy explains what Cardinal collects, why, and the choices you have. It is a first draft written for the early version of the app and will be reviewed by a lawyer before public launch. We will update it as the product grows, and tell you when the changes matter.',
    sections: [
      { h: '1. Who we are', p: ['Cardinal is a personal net worth tracker for people in the UK. In this policy, "Cardinal", "we" and "us" mean the team that runs the app. Legal entity details and a contact address will be added here when the company is set up.'] },
      { h: '2. What we collect today', p: [
        'Account details: your first name, last name, email address and a password. The password is stored in a protected form, never as plain text.',
        'Your financial entries: the accounts, assets, debts and values you type in, plus the dates of those values and any notes.',
        'Settings: your theme, display currency and similar preferences.',
        'In this early version, all of this is stored in your own browser on your own device. We do not receive a copy, so we cannot see it and cannot recover it if you clear your browser data.',
      ] },
      { h: '3. What we will collect when sync arrives', p: [
        'When we add a server so your data follows you across devices, your entries will be stored on our servers, encrypted, and linked to your account. We will update this policy before that happens and ask you to review it.',
        'When we add live bank connections through an open banking provider, we will receive your account balances and transactions from your bank, only after you approve it with your bank. We will never see your online banking login.',
      ] },
      { h: '4. How we use your data', p: [
        'To show your net worth, charts, path levels and estimates.',
        'To keep your account secure, and to send you service emails such as confirming your account or resetting a password.',
        'To fix problems and improve Cardinal.',
        'We do not sell your personal data.',
      ] },
      { h: '5. Anonymised and aggregated data', p: [
        'We may combine information from many users into statistics that cannot identify any person, for example the average share of net worth held in cash by people at a given level. This is called anonymised data. We remove names, emails and anything that could point back to you, and we only publish or share figures that cover groups large enough that no one can be picked out.',
        'Anonymised data may be shared with, or sold to, partners such as research firms or financial companies. It will never include your name, email, account numbers or individual entries.',
      ] },
      { h: '6. Sharing identifiable data only with your consent', p: [
        'If we ever want to share information that identifies you, for example to introduce you to a partner offer or a wealth manager, we will ask you first, tell you exactly what is shared and with whom, and make it as easy to say no, or to withdraw consent later, as it was to say yes. Without your clear yes, nothing identifiable leaves Cardinal.',
      ] },
      { h: '7. Our legal basis', p: ['We process your data to provide the service you asked for (contract), to keep it secure and improve it (legitimate interests), and for anything optional such as identifiable sharing or marketing (your consent).'] },
      { h: '8. Services we use', p: [
        'To show live values, the app asks public services for exchange rates, metal prices, crypto prices and UK property sale data. These requests contain no personal information about you, though like any website visit they reveal your IP address to that service.',
        'We use no advertising trackers.',
      ] },
      { h: '9. How long we keep data', p: ['While your account is open. If you delete your account, we delete your personal data, except what we must keep by law. Anonymised data that can no longer be linked to you may be kept.'] },
      { h: '10. Your rights', p: [
        'Under UK data protection law you can ask to see your data, correct it, export it, delete it, restrict or object to how we use it, and withdraw consent at any time.',
        'You can export your data to Excel and delete your account from Settings. You can also complain to the Information Commissioner\'s Office at ico.org.uk.',
      ] },
      { h: '11. Security', p: ['We take care to protect your data. Today it stays on your device. When we add a server it will be encrypted in transit and at rest. No system is perfectly secure, so please use a strong, unique password and tell us if you notice anything odd.'] },
      { h: '12. Children', p: ['Cardinal is for people aged 18 and over.'] },
      { h: '13. Changes to this policy', p: ['We will post changes here with a new date. If a change affects how your data is used, we will tell you in the app or by email before it applies.'] },
    ],
  },
  terms: {
    title: 'Terms of Use',
    updated: UPDATED,
    intro: 'These terms are the rules for using Cardinal. They are a first draft for the early version and will be reviewed by a lawyer before public launch. By creating an account or using the app you agree to them.',
    sections: [
      { h: '1. What Cardinal is', p: ['Cardinal is a tool for tracking and understanding your own net worth. You enter your balances and values, and Cardinal adds them up and charts them. Cardinal is not a bank, and it does not hold, move or invest your money.'] },
      { h: '2. Not financial advice', p: ['Nothing in Cardinal is financial, investment, tax, legal or accounting advice. Forecasts, estimates and path levels are for information only and are not a promise or prediction of future results. Values of investments can go down as well as up. Speak to a qualified adviser before making decisions about your money.'] },
      { h: '3. Estimates and live prices', p: ['Some values are estimates built from public data, for example exchange rates, metal prices, crypto prices, property price indexes, car depreciation curves and watch market indexes. They are averages, can be out of date, and may not match what you would actually get if you sold. You are responsible for checking and updating the values you rely on.'] },
      { h: '4. Your account', p: ['You must be 18 or over. Give accurate details and keep your password safe. You are responsible for what happens under your account. Tell us if you think someone else has access.'] },
      { h: '5. Your data', p: ['The information you enter is yours. You give us permission to process it to run the app as described in our Privacy Policy. In this early version your data is stored in your browser on your device, so please export it regularly. If you clear your browser data, or lose the device, it may be lost.'] },
      { h: '6. Acceptable use', p: ['Do not misuse Cardinal: no attempts to break it or get into other people\'s accounts, no automated scraping, and no using it for anything unlawful.'] },
      { h: '7. Bank connections', p: ['When live bank connections arrive, they will be provided through a regulated open banking provider. You choose which accounts to connect, you approve each connection with your bank, and you can disconnect at any time. Extra terms may apply and we will show them before you connect.'] },
      { h: '8. Availability and changes', p: ['Cardinal is an early product. Features may change, pause or be removed, and the app may be unavailable from time to time. We will try to give notice of changes that matter.'] },
      { h: '9. Our responsibility', p: ['We provide Cardinal with reasonable care, but cannot promise it will be error free. To the extent the law allows, we are not responsible for losses that come from relying on estimates or prices shown in the app, or from data lost because it was only stored on your device. Nothing here limits liability that cannot be limited by law, such as for death or personal injury caused by negligence, or for fraud.'] },
      { h: '10. Ending your account', p: ['You can delete your account at any time from Settings. We may suspend or close accounts that break these terms.'] },
      { h: '11. Changes to these terms', p: ['We may update these terms. We will post the new version with its date, and tell you about important changes. Continuing to use Cardinal after a change means you accept it.'] },
      { h: '12. Governing law', p: ['These terms are governed by the law of England and Wales, and the courts of England and Wales can hear any dispute, though if you live elsewhere in the UK you keep any rights you have to use your local courts.'] },
    ],
  },
};

export function InfoPage({ id }: { id?: string }) {
  const d = PAGES[id ?? ''] ?? PAGES.about;
  return (
    <div className="page">
      <button className="back" onClick={() => history.length > 1 ? history.back() : (location.hash = '#/')}><Icon name="back" size={18} /> Back</button>
      <section className="card info-card">
        <h1>{d.title}</h1>
        {d.updated && <p className="muted small">Last updated {d.updated}</p>}
        <p className="muted">{d.intro}</p>
        {d.sections.map((s) => (
          <div key={s.h} className="info-sec">
            <h2>{s.h}</h2>
            {s.p.map((t, i) => <p key={i}>{t}</p>)}
          </div>
        ))}
      </section>
    </div>
  );
}
