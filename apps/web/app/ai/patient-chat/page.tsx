export default function AiPatientChatPage() {
  return (
    <main>
      <h1>AI Patient Chat</h1>
      <p>Ask a question and get non-diagnostic guidance.</p>
      <form>
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={4} />
        <label htmlFor="language">Language</label>
        <input id="language" name="language" placeholder="en" />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}
