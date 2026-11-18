import { Icon } from '../components/Icon';

interface Section { h: string; p: string[] }
interface Doc { title: string; updated?: string; intro: string; sections: Section[] }

const UPDATED = '18 November 2026';

/** About, Contact, Privacy Policy and Terms Of Use. Privacy and Terms are two separate documents. */
const PAGES: Record<string, Doc> = {
  about: {
    title: "About Cardinal",
    intro: "Cardinal shows everything you own in one number, and how it moves over time. It is made for people who moved to a big city, work hard, and want to be considered with money without making a fuss about it.",
    sections: [
      { h: "What It Does", p: ["Add your bank accounts, ISAs, investments, pensions, crypto and the things you own, like watches, cars, property and gold. Cardinal adds it all up, charts it, and shows how far you have come on your Net Worth Path."] },
      { h: "Read Only By Design", p: ["Cardinal never moves your money and never asks for your bank password. Live bank connections will use regulated open banking, where you approve access with your bank and can stop it at any time."] },
      { h: "Private By Default", p: ["Your amounts are yours. In Connections, friends only ever see percentages, never how much you have or made. Hide every number with the eye button when you are on the Tube."] },
      { h: "Where We Are", p: ["Cardinal is in its early version and is built in London. New features arrive often, starting with sync across devices and live bank connections."] },
    ],
  },
  contact: {
    title: "Contact",
    intro: "A contact address for Cardinal will be published here soon.",
    sections: [
      { h: "In The Meantime", p: ["If you were given access to Cardinal by the team, reply to the email you received from us."] },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    updated: UPDATED,
    intro: "How Cardinal handles your personal data: what we collect, why, on what legal basis, how long we keep it and the rights you have. This is a first draft for the early version of the app and will be reviewed by a lawyer before public launch.",
    sections: [
      { h: "1. Who We Are", p: ["Cardinal (\"we\", \"us\") is a personal net worth tracker for people in the UK and is the controller of your personal data. Company details and a privacy contact address will be added here when the company is registered."] },
      { h: "2. The Data We Collect", p: ["Account data: first name, last name, email address and password. Passwords are stored only in a protected (hashed) form.", "Financial data you enter: accounts, assets, debts, their values and dates, and any notes.", "Connections data: the friends and groups you add and whether you take part in rankings.", "Settings: theme, display currency and similar preferences.", "Today all of this is stored in your own browser on your own device. We do not receive a copy, so we cannot see it and cannot recover it if you clear your browser data."] },
      { h: "3. Why We Use It", p: ["To run Cardinal for you: work out your net worth, charts, Net Worth Path level and estimates.", "To keep your account secure and send service emails, such as confirming your account or resetting a password.", "To fix problems and improve the app.", "To create anonymised statistics, as described in section 5."] },
      { h: "4. Our Lawful Basis", p: ["Contract: to provide the service you signed up for.", "Legitimate interests: to keep Cardinal secure, prevent misuse and improve it, where this does not override your rights.", "Consent: for anything optional, such as sharing data that identifies you with a partner, or marketing. You can withdraw consent at any time.", "Legal obligation: where the law requires us to keep or share information."] },
      { h: "5. Anonymised Data", p: ["We may combine data from many users into statistics that cannot identify anyone, for example the average share of net worth held in cash at each Path level. Names, emails, account numbers and individual entries are removed, and we only use groups large enough that no person can be picked out.", "Anonymised statistics may be shared with or sold to partners such as research firms or financial companies. Once data is truly anonymised it is no longer personal data."] },
      { h: "6. Identifiable Data Only With Your Consent", p: ["We will never share information that identifies you without asking first. If we want to introduce you to a partner, for example a reward or a wealth manager at a higher Path level, we will tell you exactly what would be shared and with whom, and ask for a clear yes. Saying no is as easy as saying yes, and you can withdraw consent later in Settings.", "We do not sell personal data."] },
      { h: "7. Who Receives Data", p: ["Today: nobody, because your data stays on your device.", "When sync arrives: a hosting provider that stores your data encrypted for us, under a contract that only lets them act on our instructions. When bank connections arrive: a regulated open banking provider, only for the accounts you choose.", "To show live values, the app asks public services for exchange rates and prices. These requests contain nothing about you, though like any website visit they reveal your IP address."] },
      { h: "8. International Transfers", p: ["If a provider stores data outside the UK, we will only use one covered by UK adequacy regulations or the UK International Data Transfer Agreement."] },
      { h: "9. How Long We Keep It", p: ["For as long as your account is open. When you delete your account we delete your personal data within 30 days, except anything the law requires us to keep. Anonymised statistics may be kept."] },
      { h: "10. Your Rights", p: ["Under UK GDPR you can ask to access, correct, export or delete your data, restrict or object to how we use it, and withdraw consent at any time. You can already export everything to Excel and delete your account from Settings.", "If you are unhappy with how we handle your data you can complain to the Information Commissioner's Office at ico.org.uk."] },
      { h: "11. Security", p: ["Today your data stays on your device. When we add a server it will be encrypted in transit and at rest, and access will be limited to the people who need it. Please use a strong, unique password."] },
      { h: "12. Children", p: ["Cardinal is for people aged 18 and over. We do not knowingly collect data from children."] },
      { h: "13. Public Data Licences", p: ["Some property estimates use public data. Contains HM Land Registry data © Crown copyright and database right 2026. This data is licensed under the Open Government Licence v3.0."] },
      { h: "14. Contact And Changes", p: ["A privacy contact address will be published here. We will post any change to this policy with a new date and tell you in the app or by email before a change that affects your data applies."] },
    ],
  },
  terms: {
    title: "Terms Of Use",
    updated: UPDATED,
    intro: "The agreement between you and Cardinal for using the app. Please read it before you use Cardinal. This is a first draft for the early version and will be reviewed by a lawyer before public launch.",
    sections: [
      { h: "1. The Service", p: ["Cardinal is a tool for tracking your own net worth. You enter balances and values, and Cardinal adds them up, charts them and shows your progress. Cardinal is not a bank, payment service or investment firm, and it does not hold, move or invest money."] },
      { h: "2. Who Can Use It", p: ["You must be 18 or over and live in the UK. By creating an account you confirm that you meet these conditions and accept these terms."] },
      { h: "3. Your Account", p: ["Give accurate details, keep your password safe and do not share your account. You are responsible for activity under your account. Tell us straight away if you think someone else has access."] },
      { h: "4. Acceptable Use", p: ["You agree not to: break or probe the app's security; access other people's accounts or data; scrape or copy the app by automated means; upload anything unlawful, harmful or misleading; or use Cardinal for any illegal purpose. In Connections, only invite people who are happy to be invited."] },
      { h: "5. Not Financial Advice", p: ["Nothing in Cardinal is financial, investment, tax or legal advice. Forecasts, estimates, rankings and Path levels are information only and are not a promise of future results. Investments can go down as well as up. Speak to a qualified adviser before making financial decisions."] },
      { h: "6. Values And Estimates", p: ["Some values are estimates or live prices from public data. They can be wrong or out of date and may not match what you would get if you sold. You are responsible for the values you enter and rely on."] },
      { h: "7. Rewards And Partners", p: ["Path level rewards and partner offers, when they arrive, are provided by the partner on its own terms. We are not responsible for a partner's products. Any sharing of your details with a partner needs your consent, as our Privacy Policy explains."] },
      { h: "8. Intellectual Property", p: ["Cardinal, its name, bird logo, design and software belong to us. You may use the app for your own personal, non commercial use. The data you enter stays yours."] },
      { h: "9. Availability", p: ["Cardinal is an early product. Features may change, pause or be removed, and the app may sometimes be unavailable. In this version your data lives only on your device, so please export it regularly."] },
      { h: "10. Liability", p: ["We provide Cardinal with reasonable care and skill. To the extent the law allows, we are not liable for losses caused by relying on estimates, prices, forecasts or rankings, for data lost because it was stored only on your device, or for indirect losses. Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or any other liability that cannot be limited by law, and your statutory rights as a consumer are not affected."] },
      { h: "11. Ending Your Account", p: ["You can stop using Cardinal and delete your account at any time in Settings. We may suspend or close an account that breaks these terms, and will tell you why unless the law prevents it."] },
      { h: "12. Changes To These Terms", p: ["We may update these terms and will post the new version with its date. We will tell you about important changes before they apply. If you do not agree, you can delete your account."] },
      { h: "13. Governing Law", p: ["These terms are governed by the law of England and Wales. Disputes go to the courts of England and Wales, but if you live in Scotland or Northern Ireland you can also bring proceedings in your local courts."] },
    ],
  },
};

export function InfoPage({ id }: { id?: string }) {
  const d = PAGES[id ?? ''] ?? PAGES.about;
  return (
    <div className="page">
      <button className="back" onClick={() => history.length > 1 ? history.back() : (location.hash = '#/')}><Icon name="back" size={18} /> Back</button>
      <article className="card info-card" key={id}>
        <h1>{d.title}</h1>
        {d.updated && <p className="info-date">Last Updated {d.updated}</p>}
        <p>{d.intro}</p>
        {d.sections.map((s) => (
          <section key={s.h} className="info-sec">
            <h2>{s.h}</h2>
            {s.p.map((t, i) => <p key={i}>{t}</p>)}
          </section>
        ))}
      </article>
    </div>
  );
}
