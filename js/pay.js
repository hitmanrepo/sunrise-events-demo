// pay.js — fake ₹500 advance payment demo (MOTION-SPEC §3.9). Detail pages only, no external requests. Terse names (D=document, ps-/pb-/su- CSS classes) to stay lean — no real payment happens here, see README.
(function () {
var D = document;
var R = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, S, P, B, L;
function e(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

var LOGO = '<svg width="30" height="30" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#FFF7EB"/><circle cx="20" cy="26" r="7" fill="#E3A81C"/><path d="M6 26A14 14 0 0 1 34 26" fill="none" stroke="#F07C1D" stroke-width="3" stroke-linecap="round"/></svg>';
var UPI = '<svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FBEDD8"/><path d="M7 12a5 5 0 1 1 1.6 3.6M9.2 14l-2 1.6-1-2.4" fill="none" stroke="#D95F0E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var BAL = '<svg viewBox="0 0 60 76" width="120" height="150"><ellipse cx="30" cy="30" rx="26" ry="30" fill="#E8503A"/><ellipse cx="21" cy="19" rx="8" ry="12" fill="#fff" opacity="0.3"/><polygon points="25,58 35,58 30,66" fill="#E8503A"/></svg>';

function buildSheet() {
  S = D.createElement('div'); S.className = 'ps';
  S.innerHTML = '<div class="ps-bd" data-x></div><div class="ps-panel" role="dialog" aria-modal="true" aria-labelledby="pst" tabindex="-1"><button type="button" class="ps-x" data-x aria-label="Close">&times;</button><div class="ps-head">' + LOGO + '<strong id="pst">Sunrise Events</strong></div><div class="ps-body"></div></div>';
  D.body.appendChild(S);
  P = S.querySelector('.ps-panel'); B = S.querySelector('.ps-body');
  S.addEventListener('click', function (v) { if (v.target.hasAttribute('data-x')) close(); });
}
function formState(n, pr, wa) {
  B.innerHTML = '<p class="ps-pkg">' + e(n) + '</p><p class="ps-price">' + e(pr) + ' &middot; starting price</p><div class="ps-adv"><span>Advance</span><b>&#8377;500</b></div><div class="ps-upi">' + UPI + '<span><span class="ps-upin">UPI</span><span class="ps-upis">sunrise@upi &middot; any UPI app</span></span></div><button type="button" class="btn btn--saffron btn--lg btn--block" id="payBtn">Pay &#8377;500</button><p class="ps-fine">Demo only &mdash; koi asli payment nahin hogi.</p>';
  D.getElementById('payBtn').addEventListener('click', function () { pay(n, wa); });
}
function pay(n, wa) {
  var b = D.getElementById('payBtn');
  b.disabled = true;
  b.innerHTML = '<span class="ps-spin"></span>Processing&hellip;';
  setTimeout(function () { showSuccess(n, wa); }, 1200);
}
function showSuccess(n, wa) {
  var ref = 'SE-' + Math.floor(1000 + Math.random() * 9000);
  var chk = R ? '<div class="su-check">&#10003;</div>' : '';
  B.innerHTML = '<div class="su">' + chk + '<h3>Booking pakki! &#127881;</h3><p class="su-ref">Ref: ' + ref + '</p><p>' + e(n) + '</p><p>Hamari team aapko WhatsApp par confirm karegi.</p><div class="su-actions"><a class="btn btn--wa btn--lg btn--block" href="' + e(wa) + '" target="_blank" rel="noopener">WhatsApp pe baat karo</a><button type="button" class="btn btn--outline btn--lg btn--block" data-x>Close</button></div></div>';
  if (!R) blast();
}
function blast() {
  var colors = ['#E3A81C', '#F07C1D', '#D94F7E'];
  var w = D.createElement('div'); w.className = 'pb';
  w.innerHTML = '<div class="pb-bln">' + BAL + '</div><div class="pb-ring"></div>';
  for (var i = 0; i < 36; i++) {
    var petal = i % 3 === 0, p = D.createElement('div');
    p.className = 'pb-p ' + (petal ? 'pb-p--pt' : 'pb-p--r');
    var a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 130;
    p.style.setProperty('--tx', (Math.cos(a) * d).toFixed(0) + 'px');
    p.style.setProperty('--ty', (Math.sin(a) * d).toFixed(0) + 'px');
    p.style.setProperty('--rot', (Math.random() * 360).toFixed(0) + 'deg');
    p.style.background = petal ? '#F07C1D' : colors[i % 3];
    w.appendChild(p);
  }
  D.body.appendChild(w);
  setTimeout(function () { w.parentNode && w.parentNode.removeChild(w); }, 2000);
}
function openSheet(btn) {
  if (!S) buildSheet();
  L = D.activeElement;
  formState(btn.getAttribute('data-name'), btn.getAttribute('data-price'), btn.getAttribute('data-wa'));
  D.documentElement.classList.add('pl');
  S.classList.add('is-open');
  D.addEventListener('keydown', onKey);
  setTimeout(function () { P.focus(); }, 10);
}
function close() {
  if (!S) return;
  S.classList.remove('is-open');
  D.documentElement.classList.remove('pl');
  D.removeEventListener('keydown', onKey);
  L && L.focus && L.focus();
}
function onKey(v) { if (v.key === 'Escape') close(); }

var btns = D.querySelectorAll('.demo-book');
for (var i = 0; i < btns.length; i++) {
  btns[i].addEventListener('click', function (v) { openSheet(v.currentTarget); });
}
})();
