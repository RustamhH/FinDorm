import { CONTACT, toTel } from "./contact";

export default function Footer() {
  const tel = toTel(CONTACT.phone);
  return (
    <footer className="footer" id="elaqe">
      <h3>Əlaqə</h3>
      <div className="contacts">
        <a href={`mailto:${CONTACT.email}`}><span>Gmail</span><small>{CONTACT.email}</small></a>
        <div className="contact-static"><span>LinkedIn</span><small>Tezliklə</small></div>
        <div className="contact-static"><span>Instagram</span><small>Tezliklə</small></div>
        <a href={`tel:${tel}`}><span>Nömrə</span><small>{CONTACT.phone}</small></a>
      </div>
      <p>© FinDorm. Tələbələr üçün ağıllı mənzil axtarışı.</p>
    </footer>
  );
}
