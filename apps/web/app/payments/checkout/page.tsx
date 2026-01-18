export default function CheckoutPage() {
  return (
    <main>
      <h1>Checkout</h1>
      <p>Select your payment method and complete checkout.</p>
      <form>
        <label htmlFor="amount">Amount</label>
        <input id="amount" name="amount" type="number" min="0" step="0.01" />
        <label htmlFor="currency">Currency</label>
        <input id="currency" name="currency" placeholder="GHS" />
        <label htmlFor="provider">Provider</label>
        <select id="provider" name="provider">
          <option value="MOMO">MoMo</option>
          <option value="STRIPE">Stripe</option>
        </select>
        <label htmlFor="momoPhone">MoMo phone</label>
        <input id="momoPhone" name="momoPhone" placeholder="+23300000000" />
        <button type="submit">Pay now</button>
      </form>
    </main>
  );
}
