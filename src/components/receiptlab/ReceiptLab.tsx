'use client';
import { useEffect, useRef, useState } from 'react';
import { coinbaseAmountFont } from './receipt-font';
import { bybitRows, BYBIT_SAMPLE_NOTICE, drawBybitReceipt } from './bybit-template';
import {
  drawGcashReceipt,
  drawOkxReceipt,
  MOBILE_SAMPLE_NOTICE,
} from './mobile-receipt-templates';
import { drawChaseReceipt, getChaseStatusPresentation } from './chase-template';
import {
  drawInvoice,
  invoiceMoney,
  invoiceTotals,
  isInvoiceTemplate,
  type InvoiceTemplateId,
} from './invoice-template';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query as firestoreQuery,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import {
  Archive,
  Check,
  Copy,
  ChevronDown,
  CreditCard,
  Download,
  FileImage,
  FileText,
  History,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Users,
  X,
} from 'lucide-react';
// ReceiptLab is embedded inside Nevora and uses Nevora's licensed route. Keep
// Firebase out of this client bundle; the standalone Toolkit auth flow is not
// needed here and can attempt to parse unset Firebase URLs in deployments.
const auth = null as Auth | null;
const db = null as Firestore | null;
const firebaseConfigured = false;
type View = 'dashboard' | 'templates' | 'editor' | 'history' | 'admin';
type Template = {
  id: string;
  name: string;
  category: string;
  accent: string;
  description: string;
};
type HistoryRow = {
  id: string;
  title: string;
  template: string;
  amount: string;
  date: string;
  status: 'Draft' | 'Exported';
};
const templates: Template[] = [
  {
    id: 'studio',
    name: 'CashApp',
    category: 'Retail',
    accent: '#665cf6',
    description: 'Clean and editorial',
  },
  {
    id: 'mono',
    name: 'Paypal',
    category: 'Minimal',
    accent: '#111827',
    description: 'Classic thermal style',
  },
  {
    id: 'citrus',
    name: 'Trust Wallet',
    category: 'Crypto',
    accent: '#2584a8',
    description: 'Transfer detail',
  },
  {
    id: 'orbit',
    name: 'Venmo',
    category: 'Payments',
    accent: '#3186d8',
    description: 'Payment details',
  },
  {
    id: 'blue',
    name: 'CoinBase',
    category: 'Transfer',
    accent: '#3975f6',
    description: 'Success confirmation',
  },
  {
    id: 'indigo',
    name: 'Zelle',
    category: 'Confirmation',
    accent: '#2f66b8',
    description: 'Recipient confirmation',
  },
  {
    id: 'black',
    name: 'Bybit',
    category: 'Crypto',
    accent: '#ff9e2c',
    description: 'Light payment confirmation',
  },
  {
    id: 'dark-blue',
    name: 'Binance',
    category: 'Crypto',
    accent: '#28bf8b',
    description: 'Deposit confirmation',
  },
  {
    id: 'gcash',
    name: 'Gcash',
    category: 'Payments',
    accent: '#0964e8',
    description: 'Express send receipt',
  },
  {
    id: 'okx',
    name: 'OKX Wallet',
    category: 'Crypto',
    accent: '#111111',
    description: 'Withdrawal details',
  },
  {
    id: 'boa',
    name: 'BOA',
    category: 'Banking',
    accent: '#173f91',
    description: 'Scheduled payment confirmation',
  },
  {
    id: 'citi-bank',
    name: 'CiTi Bank',
    category: 'Banking',
    accent: '#14866d',
    description: 'Formal payment confirmation',
  },
  {
    id: 'wells-fargo',
    name: 'Wells Fargo',
    category: 'Banking',
    accent: '#c6282d',
    description: 'Wire money details statement',
  },
  {
    id: 'chase',
    name: 'Chase Bank',
    category: 'Banking',
    accent: '#126bc5',
    description: 'Pending payment receipt',
  },
  {
    id: 'invoice-aurora',
    name: 'Bank Template',
    category: 'Banking',
    accent: '#2563eb',
    description: 'Editable bank payment confirmation',
  },
  {
    id: 'invoice-ledger',
    name: 'Bank Template',
    category: 'Banking',
    accent: '#171717',
    description: 'Editable payment confirmation',
  },
  {
    id: 'invoice-nova',
    name: 'ANZ Bank Template',
    category: 'Banking',
    accent: '#087f5b',
    description: 'Editable dark bank transfer receipt',
  },
];
export default function ReceiptLab() {
  const [user, setUser] = useState<User | null>({ displayName: 'Nevora Creator', email: 'creator@nevora.app' } as User),
    [authReady, setAuthReady] = useState(!firebaseConfigured),
    [authBusy, setAuthBusy] = useState(false),
    [authError, setAuthError] = useState(''),
    [register, setRegister] = useState(false),
    [view, setView] = useState<View>('dashboard'),
    [dark, setDark] = useState(false),
    [mobile, setMobile] = useState(false),
    [template, setTemplate] = useState(templates[0]),
    [query, setQuery] = useState(''),
    [toast, setToast] = useState(''),
    [watermarkEnabled, setWatermarkEnabled] = useState(true),
    [historyRows, setHistoryRows] = useState<HistoryRow[]>([]),
    [invoiceLogo, setInvoiceLogo] = useState('');
  const [form, setForm] = useState<Record<string, string>>({
    merchant: 'Wright',
    item: '$Payday1080',
    amount: '80.00',
    tax: '0.00',
    date: 'Today at 9:17 PM',
    note: 'Thanks for trying ReceiptLab.',
    monoMessage: "You've sent",
    monoCurrency: 'USD',
    monoRecipient: 'lcantrell44@hotmail.com',
    citrusAmount: '-50000',
    citrusAsset: 'BTC',
    citrusFiat: '≈ $5,417,300,000.00',
    citrusDate: 'Today at 2:10 PM',
    citrusStatus: 'Completed',
    citrusRecipient: 'bc1qplf...7qrp2v',
    citrusFee: '600 BTC ($65020200.00)',
    orbitName: 'Kristine Freelund',
    orbitNote: '"🎁🎄🍬 Xmas Brunch"',
    orbitAmount: '- $50',
    orbitLikes: '0',
    orbitComments: '0',
    orbitStatus: 'Complete',
    orbitMethod: 'Venmo balance',
    orbitDate: 'December 10, 2022, 12:46 PM',
    orbitHandle: '@SpaceUnicorn80',
    blueTitle: 'Payment to',
    blueAddress: '0x331160f21825c2047c5528b0357b87c545ebf1dc',
    blueFiat: '$10,636.33',
    blueCrypto: '9.99993699 ETH',
    blueFeeFiat: '$0.04',
    blueFeeCrypto: '0.000042000000147 ETH',
    blueConfirmed: 'Jun 15',
    indigoMessage:
      "We’re sending your money now. Kayla Zelle will get it in a few minutes.",
    indigoAmount: '$50.00',
    indigoName: 'Kayla Zelle',
    indigoRegistered: 'Registered as Jeffrey',
    indigoPhone: '(678) 237-8125',
    indigoSiri:
      'Add a Siri shortcut, such as “Pay Kayla,” to save time when sending money.',
    indigoSiriButton: 'Add to Siri',
    indigoDone: 'Done',
    blackHeader: 'Payment',
    blackStatus: 'Success',
    blackAmount: '10.00 USDT',
    blackPayTo: '(jdoe7***@protonmail.com)',
    blackBybitId: '76891234',
    blackMethod: 'Send',
    blackFee: '0.5 USDT',
    blackTransactionFee: '1 USDT',
    blackPayWith: '1,045.45 USDT',
    blackMemo: '--',
    blackTime: '2025-04-29 11:41:43',
    blackTxid: '0x...8a...5c...2f',
    blackOrder: '9102837465',
    blackShare: 'Download Bybit App',
    blackDone: 'View details',
    darkBlueAmount: '+200 USDT',
    darkBlueStatus: 'Completed',
    darkBlueMessage:
      'Crypto has arrived in your Binance account. View your spot account balance for more details.',
    darkBlueNetwork: 'ETH',
    darkBlueAddress: '0xcc81efc504d111ed31ca026d0aff9cb3350f0fb6',
    darkBlueTxid: 'Off-chain transfer 172490923091',
    darkBlueWallet: 'Funding Wallet',
    darkBlueDate: '2024-05-10 10:51:01',
    gcashTime: '10:06',
    gcashRecipient: 'HA•••D D.',
    gcashPhone: '+63 915 750 3350',
    gcashAmount: '3,000.00',
    gcashTotal: '₱3000.00',
    gcashReference: '9040035185241',
    gcashDate: 'Apr 22, 2026 10:06 AM',
    okxAmount: '- 10.316428 USDT',
    okxStatus: 'Sent',
    okxHelp: "Why hasn’t my transaction arrived?",
    okxBlockchain: 'TRC20',
    okxType: 'On-chain withdrawal',
    okxAddress: 'THujD8W62Jmhd5WCrlUEhG75K4UzY18tYuX',
    okxTransaction: 'fdf84500a1f28e4c0ff88ee10de23df4e7c519379c91fd18c908cdc9789065df',
    okxFee: '1 USDT',
    okxTime: '02/09/2024, 19:23:29',
    okxReference: '151708673',
    okxButton: 'View on blockchain explorer',
    boaBankCard: 'BANK OF AMERICA - PERSONAL CARD-9654',
    boaCardType: 'Financial Rewards Platinum Plus',
    boaPayFrom: 'Adv Plus Banking - 8599',
    boaAmount: '$4,955.99',
    boaDeliverBy: 'Mar 03, 2021',
    boaFrequency: 'One Time',
    boaPaymentType: 'Electronic',
    boaConfirmation: 'R9JFG-8F243',
    boaFooter: 'Payments to this Bank of America Card/Small Business Loan account',
    citiName: 'CINDY', citiConfirmation: '612060986782997', citiSource: 'Guarantee Bank and Trust Company', citiSourceEnding: '5901', citiAmount: '$1,500.00', citiDate: 'JUL 09, 2026', citiPayTo: 'CiTi ThankYou® Mastercard®', citiPayToEnding: '0930',
    wellsRecipient: 'Dana Pease', wellsRecipientAccount: 'United States ...4204', wellsSource: 'EVERYDAY CHECKING ...8928', wellsAmount: '$23,073.67', wellsFees: '$30.00', wellsTotal: '$23,103.67', wellsSendDate: '02/23/2022', wellsDeliverDate: '02/23/2022', wellsMessage: 'Pay off on 2 Acres', wellsStatus: 'Completed', wellsConfirmation: 'OW00001992201633',
    chaseReceiptDate: 'July 14, 2026',
    chaseStatusTitle: 'Payment pending',
    chaseStatusMessage: 'Your payment is being processed.',
    chaseAmount: '$2,500,000.00',
    chaseCurrency: 'USD',
    chaseRecipient: 'Frank Lowe',
    chaseEmail: 'FrankLowe2013@yahoo.com',
    chaseTransactionId: '7b8e2d41c9',
    chaseDate: 'July 14, 2026',
    chaseTime: '3:25 AM UTC',
    chaseMethod: 'Chase bank balance',
    chaseStatus: 'Pending',
    chaseFee: '$900.00',
    chaseTotal: '$2,500,900.00',
    invoiceBusiness: 'Bank Template',
    invoiceEmail: 'hello@nevora.example',
    invoiceAddress: '223 Sample Street, New York, NY',
    invoicePhone: '+1 (000) 123-4567',
    invoicePaymentInfo: 'PayPal: billing@nevora.example',
    invoiceSigner: 'Alex Morgan',
    invoiceSignerTitle: 'Creative Director',
    invoiceNumber: 'INV-2048',
    invoiceClient: 'Sample Client Co.',
    invoiceClientEmail: 'accounts@sample.example',
    invoiceIssueDate: 'September 7, 2026',
    invoiceDueDate: 'September 21, 2026',
    invoiceDescription: 'Brand identity and product design services',
    invoiceQuantity: '1',
    invoiceUnitPrice: '1850',
    invoiceTaxRate: '7.5',
    invoiceCurrency: 'USD',
    invoiceNotes: 'Thank you for your business. Payment is due within 14 days.',
    auroraPaymentDate: '11 September 2026',
    auroraBankName: 'ABSA BANK',
    auroraAccountNumber: '1234567890',
    auroraYourReference: 'FLASH DEMO',
    auroraRecipientReference: 'ASLAM DESAI',
    auroraTransactionNumber: 'b3c231a1-5720-4374-8b47-d11cf288e28f',
    auroraNotice: 'You can share your proof of payment from payment history.',
    auroraFinishLabel: 'Finish',
    auroraNewPaymentLabel: 'New payment',
    ledgerStatus: 'Sent!',
    ledgerCurrency: 'PHP',
    ledgerAmount: '950.00',
    ledgerServiceFee: '10.00',
    ledgerTotalAmount: '960.00',
    ledgerPaymentMethod: 'InstaPay',
    ledgerRecipientName: 'Flash Demon',
    ledgerRecipientDetails: 'G-Xchange, Inc. / Gcash',
    ledgerRecipientAccount: '09909090909',
    ledgerSenderName: 'Flash Demon',
    ledgerSenderAccount: '••••••5287',
    ledgerCreatedOn: 'Mar 30, 2026 7:15 AM',
    ledgerReferenceNumber: 'BN-20260330-06210034',
    ledgerInvoiceNumber: '779583',
    novaStatus: 'Completed',
    novaCurrency: '$',
    novaAmount: '500.00',
    novaRecipientName: 'Jane Truong',
    novaRecipientBsb: '733132',
    novaRecipientAccount: '536139',
    novaFrom: 'ANZ Pensioner Advantage',
    novaMessage: 'JtTF bw bank pay wpc500',
    novaReference: '733132-536139',
    novaDate: '21 Dec 2021',
    novaReceiptNumber: '735446',
  });
  const ref = useRef<HTMLDivElement>(null),
    total = (Number(form.amount || 0) + Number(form.tax || 0)).toFixed(2);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Creator';

  function go(v: View) {
    setView(v);
    setMobile(false);
  }
  function notify(s: string) {
    setToast(s);
    setTimeout(() => setToast(''), 2400);
  }

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      return;
    }

    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setAuthReady(true);
      },
      (error) => {
        setAuthError(firebaseErrorMessage(error));
        setAuthReady(true);
      },
    );
  }, []);

  useEffect(() => {
    if (!user || !firebaseConfigured || !db) {
      return;
    }

    const receiptsQuery = firestoreQuery(
      collection(db, 'users', user.uid, 'receipts'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    return onSnapshot(
      receiptsQuery,
      (snapshot) => {
        setHistoryRows(
          snapshot.docs.map((receipt) => {
            const data = receipt.data();
            const createdAt = data.createdAt?.toDate?.();
            return {
              id: receipt.id,
              title: data.title || 'Untitled demo receipt',
              template: data.template || 'ReceiptLab',
              amount: data.amount || '—',
              date: createdAt
                ? new Intl.DateTimeFormat('en', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(createdAt)
                : 'Just now',
              status: data.status === 'Exported' ? 'Exported' : 'Draft',
            };
          }),
        );
      },
      (error) => notify(firebaseErrorMessage(error)),
    );
  }, [user]);

  async function submitAuth(details: {
    name: string;
    email: string;
    password: string;
  }) {
    if (!firebaseConfigured || !auth || !db) {
      setAuthError(
        'Firebase is not configured yet. Add the NEXT_PUBLIC_FIREBASE_* variables in Vercel.',
      );
      return;
    }

    setAuthBusy(true);
    setAuthError('');
    try {
      if (register) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          details.email,
          details.password,
        );
        await updateProfile(credential.user, { displayName: details.name });
        await setDoc(doc(db, 'users', credential.user.uid), {
          displayName: details.name,
          email: details.email,
          role: 'user',
          createdAt: serverTimestamp(),
        });
        await credential.user.reload();
        setUser(auth.currentUser);
      } else {
        await signInWithEmailAndPassword(
          auth,
          details.email,
          details.password,
        );
      }
    } catch (error) {
      setAuthError(firebaseErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }
  async function resetPassword(email: string) {
    if (!firebaseConfigured || !auth) {
      setAuthError('Firebase is not configured yet.');
      return;
    }
    if (!email) {
      setAuthError('Enter your email address first.');
      return;
    }
    setAuthBusy(true);
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthError('Password reset email sent.');
    } catch (error) {
      setAuthError(firebaseErrorMessage(error));
    } finally {
      setAuthBusy(false);
    }
  }
  async function saveReceipt(status: 'Draft' | 'Exported', quiet = false) {
    if (!user || !firebaseConfigured || !db) {
      if (!quiet) notify('Sign in with Firebase to save receipts');
      return;
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'receipts'), {
        title: `${template.name} demo ${isInvoiceTemplate(template.id) ? 'invoice' : 'receipt'}`,
        templateId: template.id,
        template: template.name,
        amount: receiptAmount(template.id, form, total),
        status,
        form,
        watermarkEnabled,
        safetyNotice: 'DEMO • NOT A REAL TRANSACTION',
        createdAt: serverTimestamp(),
      });
      if (!quiet) notify(`Demo ${isInvoiceTemplate(template.id) ? 'invoice' : 'receipt'} saved`);
    } catch (error) {
      notify(firebaseErrorMessage(error));
    }
  }
  function canvasToPdfBlob(source: HTMLCanvasElement) {
    const jpeg = source.toDataURL('image/jpeg', 0.94).split(',')[1];
    const imageBytes = Uint8Array.from(atob(jpeg), (char) => char.charCodeAt(0));
    const pageWidth = 612;
    const pageHeight = pageWidth * (source.height / source.width);
    const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
      `<< /Length ${new TextEncoder().encode(contentStream).length} >>\nstream\n${contentStream}endstream`,
      `<< /Type /XObject /Subtype /Image /Width ${source.width} /Height ${source.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>`,
    ];
    const chunks: Uint8Array[] = [];
    const offsets = [0];
    const encoder = new TextEncoder();
    const pushText = (text: string) => chunks.push(encoder.encode(text));
    pushText('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
    let byteOffset = encoder.encode('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n').length;
    objects.forEach((object, index) => {
      offsets.push(byteOffset);
      const header = index === 4
        ? `${index + 1} 0 obj\n${object}\nstream\n`
        : `${index + 1} 0 obj\n${object}\nendobj\n`;
      const headerBytes = encoder.encode(header);
      chunks.push(headerBytes);
      byteOffset += headerBytes.length;
      if (index === 4) {
        chunks.push(imageBytes);
        byteOffset += imageBytes.length;
        const end = encoder.encode('\nendstream\nendobj\n');
        chunks.push(end);
        byteOffset += end.length;
      }
    });
    const xrefOffset = byteOffset;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    xref += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(encoder.encode(xref));
    return new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' });
  }

  async function exportFile(type: 'png' | 'pdf') {
    notify(`Preparing ${type.toUpperCase()}…`);
    const c = document.createElement('canvas');
    c.width = 900;
    const contentHeight =
      template.id === 'mono'
        ? 1310
        : template.id === 'citrus'
          ? 1600
          : template.id === 'orbit'
            ? 1601
            : template.id === 'blue'
              ? 1740
              : template.id === 'indigo'
                ? 1947
                : template.id === 'black'
                  ? 1800
                  : template.id === 'dark-blue'
                    ? 1600
                    : template.id === 'gcash'
                      ? 1947
                    : template.id === 'okx'
                        ? 1800
                        : template.id === 'boa'
                          ? 1878
                          : template.id === 'citi-bank'
                            ? 1500
                            : template.id === 'wells-fargo'
                              ? 1608
                              : template.id === 'chase'
                                ? 1776
                                : template.id === 'invoice-aurora' || template.id === 'invoice-ledger' || template.id === 'invoice-nova'
                                  ? 1400
                                  : 1200;
    const requiresSampleNotice = template.id === 'black' || template.id === 'blue' || template.id === 'indigo' || template.id === 'gcash' || template.id === 'okx' || (isInvoiceTemplate(template.id) && template.id !== 'invoice-aurora');
    const safetyFooterHeight = watermarkEnabled || requiresSampleNotice ? 52 : 0;
    c.height = contentHeight + safetyFooterHeight;
    const x = c.getContext('2d');
    if (!x) return;
    if (template.id === 'boa') {
      x.fillStyle = '#fff';
      x.fillRect(0, 0, 900, 1878);
      x.textAlign = 'center';
      x.fillStyle = '#bd315c';
      x.font = '32px Arial';
      x.fillText('Success', 450, 76);
      x.fillStyle = '#5a5a5d';
      x.font = '39px Arial';
      x.fillText("You've scheduled a payment.", 450, 224);
      x.fillStyle = '#e8e9ed';
      x.beginPath(); x.roundRect(250, 330, 216, 48, 24); x.fill();
      x.beginPath(); x.roundRect(500, 330, 142, 48, 24); x.fill();
      x.beginPath(); x.roundRect(677, 330, 145, 48, 24); x.fill();
      x.fillStyle = '#16376e';
      x.font = 'bold 20px Arial';
      x.fillText('SAVE AS PDF', 358, 361);
      x.fillText('PRINT', 571, 361);
      x.fillText('EMAIL', 749, 361);
      x.strokeStyle = '#d7d7d7';
      x.lineWidth = 1;
      x.beginPath(); x.arc(92, 610, 51, 0, Math.PI * 2); x.stroke();
      x.fillStyle = '#b32845';
      x.font = 'bold 34px Arial';
      x.fillText('≋', 92, 605);
      x.textAlign = 'left';
      x.fillStyle = '#151515';
      x.font = '24px Arial';
      x.fillText(form.boaBankCard || 'BANK OF AMERICA - PERSONAL CARD-9654', 174, 552);
      x.font = '19px Arial';
      x.fillText(form.boaCardType || 'Financial Rewards Platinum Plus', 174, 666);
      const boaRow = (label: string, value: string, y: number) => {
        x.fillStyle = '#151515';
        x.font = '23px Arial';
        x.fillText(label, 44, y);
        x.fillStyle = '#77777a';
        x.textAlign = 'right';
        x.fillText(value, 858, y);
        x.textAlign = 'left';
      };
      boaRow('Pay From', form.boaPayFrom || 'Adv Plus Banking - 8599', 880);
      boaRow('Amount', form.boaAmount || '$4,955.99', 1000);
      boaRow('Deliver By', form.boaDeliverBy || 'Mar 03, 2021', 1120);
      boaRow('Frequency', form.boaFrequency || 'One Time', 1240);
      boaRow('Payment Type', form.boaPaymentType || 'Electronic', 1360);
      boaRow('Confirmation', form.boaConfirmation || 'R9JFG-8F243', 1480);
      x.fillStyle = '#77777a';
      x.font = '16px Arial';
      x.fillText(form.boaFooter || 'Payments to this Bank of America Card/Small Business Loan account', 22, 1672);
      x.fillStyle = '#103d91';
      x.beginPath(); x.roundRect(352, 1710, 196, 65, 33); x.fill();
      x.fillStyle = '#fff';
      x.textAlign = 'center';
      x.font = 'bold 20px Arial';
      x.fillText('DONE', 450, 1751);
    } else if (template.id === 'citi-bank') {
      x.fillStyle = '#fff'; x.fillRect(0, 0, 900, 1500); x.fillStyle = '#101832'; x.textAlign = 'left'; x.font = '600 28px Arial'; x.fillText('Make a Payment  ⓘ', 72, 78); x.font = '400 48px Arial'; x.fillText('Thanks for Your Payment,', 72, 188); x.fillText(form.citiName || 'CUSTOMER', 72, 246); x.fillStyle = '#e9f7f2'; x.fillRect(72, 304, 756, 112); x.fillStyle = '#14866d'; x.fillRect(72, 304, 756, 4); x.fillRect(72, 412, 756, 4); x.beginPath(); x.arc(112, 360, 25, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.fillText('✓', 112, 370); x.fillStyle = '#263b3d'; x.textAlign = 'left'; x.font = '500 22px Arial'; x.fillText('CONFIRMATION NUMBER', 158, 350); x.font = '24px monospace'; x.fillText(form.citiConfirmation || 'SAMPLE-CONFIRMATION', 158, 382); x.fillStyle = '#101832'; x.font = '24px Arial'; x.fillText('Your payment is scheduled. Look for a confirmation email in your inbox very soon.', 72, 468); x.font = 'bold 24px Arial'; x.fillText('Make Another Payment  ›', 72, 514); x.strokeStyle = '#d8dce4'; x.lineWidth = 2; x.beginPath(); x.moveTo(72, 570); x.lineTo(828, 570); x.stroke(); x.fillStyle = '#18213f'; x.font = '500 17px Arial'; x.fillText('PAYMENT SOURCE', 72, 630); x.textAlign = 'right'; x.font = '500 23px Arial'; x.fillText(form.citiSource || 'Bank account', 828, 630); x.fillText(form.citiAmount || '$0.00', 828, 742); x.fillText(form.citiDate || 'DEMO DATE', 828, 834); x.fillText(form.citiPayTo || 'Demo recipient', 828, 926); x.textAlign = 'left';
    } else if (template.id === 'wells-fargo') {
      x.fillStyle = '#fff'; x.fillRect(0, 0, 900, 1608); x.fillStyle = '#c6282d'; x.fillRect(0, 0, 900, 106); x.fillStyle = '#f6cc42'; x.fillRect(0, 106, 900, 10); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = 'bold 49px Georgia, serif'; x.fillText('WELLS FARGO', 450, 73); x.fillStyle = '#8f1d2b'; x.font = '48px Georgia, serif'; x.fillText('Wire Money - Details', 450, 177); x.strokeStyle = '#cfcfcf'; x.beginPath(); x.moveTo(0, 218); x.lineTo(900, 218); x.stroke(); x.textAlign = 'left'; x.fillStyle = '#3f3f42'; x.font = 'bold 31px Arial'; x.fillText('To', 40, 285); x.font = '31px Arial'; x.fillText(form.wellsRecipient || 'Dana Pease', 337, 285); x.fillText(form.wellsRecipientAccount || 'United States ...4204', 337, 332); const wfRows = [['From', form.wellsSource || 'EVERYDAY CHECKING ...8928'], ['Amount', form.wellsAmount || '$23,073.67'], ['Fees', form.wellsFees || '$30.00'], ['Total from account', form.wellsTotal || '$23,103.67'], ['Send on', form.wellsSendDate || '02/23/2022'], ['Deliver by', form.wellsDeliverDate || '02/23/2022'], ["Message to recipient's bank", form.wellsMessage || 'Pay off on 2 Acres'], ['Status', form.wellsStatus || 'Completed'], ['Confirmation number', form.wellsConfirmation || 'OW00001992201633']]; wfRows.forEach(([label, value], index) => { const y = 466 + index * 118; x.font = 'bold 31px Arial'; x.fillText(label, 40, y); x.font = '31px Arial'; x.fillText(value, 337, y); x.strokeStyle = '#d2d2d2'; x.beginPath(); x.moveTo(318, y + 62); x.lineTo(862, y + 62); x.stroke(); });
    } else if (template.id === 'gcash') {
      drawGcashReceipt(c, form);
    } else if (template.id === 'okx') {
      drawOkxReceipt(c, form);
    } else if (template.id === 'chase') {
      const chaseLogo = new Image();
      chaseLogo.src = '/receiptlab/chase-logo.png';
      await new Promise<void>((resolve) => {
        chaseLogo.onload = () => resolve();
        chaseLogo.onerror = () => resolve();
      });
      if (chaseLogo.complete && chaseLogo.naturalWidth) {
        drawChaseReceipt(c, form, chaseLogo);
      } else {
        drawChaseReceipt(c, form);
      }
    } else if (isInvoiceTemplate(template.id)) {
      await drawInvoice(c, template.id, form, invoiceLogo);
    } else if (template.id === 'studio') {
      const img = new Image();
      img.src = '/receiptlab/studio-reference.jpg';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
      x.fillStyle = '#14181b';
      x.fillRect(0, 0, 900, 1200);
      x.save();
      x.beginPath();
      x.arc(450, 83, 55, 0, Math.PI * 2);
      x.clip();
      x.drawImage(img, 0, 0, 900, 1200);
      x.restore();
      x.fillStyle = '#00d95f';
      x.beginPath();
      x.roundRect(48, 928, 804, 78, 39);
      x.fill();
      x.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      x.lineWidth = 2;
      x.stroke();
      x.fillStyle = '#fff';
      x.font = 'bold 33px Arial';
      x.textAlign = 'center';
      x.fillText('✓  Completed', 450, 978);
      x.textAlign = 'center';
      x.fillStyle = '#fff';
      x.font = 'bold 34px Arial';
      x.fillText(form.merchant || 'Demo name', 450, 180);
      x.fillStyle = '#aeb0b4';
      x.font = '30px Arial';
      x.fillText(`Payment to ${form.item || '$SampleUser'}`, 450, 222);
      x.fillStyle = '#fff';
      x.font = 'bold 86px Arial';
      x.fillText(`$${Number(form.amount || 0).toFixed(2)}`, 450, 565);
      x.fillStyle = '#aeb0b4';
      x.font = '30px Arial';
      x.fillText(form.date || 'Demo date', 450, 638);
    } else if (template.id === 'mono') {
      const img = new Image();
      img.src = '/receiptlab/mono-reference.jpg';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
      x.drawImage(img, 0, 0, 900, 1310);
      x.fillStyle = '#fff';
      x.fillRect(2, 260, 896, 586);
      x.strokeStyle = '#e8e8e8';
      x.lineWidth = 2;
      x.strokeRect(2, 260, 896, 586);
      x.textAlign = 'center';
      x.fillStyle = '#353535';
      x.font = '58px Arial';
      x.fillText(form.monoMessage || "You've sent", 450, 468);
      x.fillText(
        `$${Number(form.amount || 0).toFixed(2)} ${form.monoCurrency || 'USD'} to`,
        450,
        566,
      );
      const recipient = form.monoRecipient || 'sample@example.com';
      x.font = '58px Arial';
      if (x.measureText(recipient).width <= 790) {
        x.fillText(recipient, 450, 674);
      } else {
        let split = recipient.length;
        while (split > 1 && x.measureText(recipient.slice(0, split)).width > 790) {
          split -= 1;
        }
        x.fillText(recipient.slice(0, split), 450, 652);
        x.fillText(recipient.slice(split), 450, 732);
      }
    } else if (template.id === 'citrus') {
      const img = new Image();
      img.src = '/receiptlab/citrus-reference.jpg';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
      x.drawImage(img, 0, 0, 900, 1600);
      x.textAlign = 'center';
      x.fillStyle = '#fff';
      x.fillRect(150, 270, 600, 165);
      x.fillStyle = '#292929';
      x.font = 'bold 48px Arial';
      x.fillText(
        `${form.citrusAmount || '-50000'} ${form.citrusAsset || 'BTC'}`,
        450,
        350,
      );
      x.fillStyle = '#696969';
      x.font = '30px Arial';
      x.fillText(form.citrusFiat || '≈ $0.00', 450, 400);
      x.fillStyle = '#fafafa';
      x.fillRect(405, 458, 445, 280);
      x.fillRect(340, 778, 510, 92);
      x.textAlign = 'right';
      x.fillStyle = '#4e4e4e';
      x.font = '31px Arial';
      x.fillText(form.citrusDate || 'Demo date', 830, 508);
      x.fillText(form.citrusStatus || 'Completed', 830, 607);
      x.fillText(form.citrusRecipient || 'sample-address', 830, 705);
      x.font = '29px Arial';
      x.fillText(form.citrusFee || '0 BTC ($0.00)', 830, 838);
    } else if (template.id === 'orbit') {
      const img = new Image();
      img.src = '/receiptlab/orbit-reference.jpg';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
      x.drawImage(img, 0, 0, 900, 1601);
      x.textAlign = 'center';
      x.fillStyle = '#fff';
      x.fillRect(185, 354, 530, 62);
      x.fillRect(170, 438, 560, 56);
      x.fillRect(300, 512, 300, 70);
      x.fillStyle = '#272727';
      x.font = '42px Arial';
      x.fillText(form.orbitName || 'Demo recipient', 450, 401);
      x.font = '34px Arial';
      x.fillText(form.orbitNote || 'Sample payment', 450, 480);
      x.fillStyle = '#c43c42';
      x.font = '52px Arial';
      x.fillText(form.orbitAmount || '- $0', 450, 563);
      x.fillStyle = '#fff';
      x.fillRect(82, 696, 47, 48);
      x.fillRect(202, 696, 47, 48);
      x.fillStyle = '#8c9095';
      x.font = '31px Arial';
      x.fillText(form.orbitLikes || '0', 105, 735);
      x.fillText(form.orbitComments || '0', 225, 735);
      x.textAlign = 'left';
      x.fillStyle = '#fff';
      x.fillRect(38, 918, 340, 64);
      x.fillRect(100, 1096, 610, 67);
      x.fillRect(38, 1270, 565, 68);
      x.fillRect(38, 1437, 520, 65);
      x.fillStyle = '#292929';
      x.font = '39px Arial';
      x.fillText(form.orbitStatus || 'Complete', 40, 965);
      x.fillText(form.orbitMethod || 'Sample balance', 105, 1143);
      x.font = '37px Arial';
      x.fillText(form.orbitDate || 'Demo date', 40, 1318);
      x.font = '39px Arial';
      x.fillText(form.orbitHandle || '@SampleUser', 40, 1484);
    } else if (template.id === 'blue') {
      const amountFamily = coinbaseAmountFont.style.fontFamily;
      try {
        const loaded = await document.fonts.load(
          `800 62px ${amountFamily}`,
          `${form.blueFiat || '$0.00'} ${form.blueCrypto || '0 USDT'}`,
        );
        if (!loaded.length) throw new Error('Amount font unavailable');
      } catch {
        notify('The amount font could not load. Please retry the download.');
        return;
      }
      x.fillStyle = '#ffffff';
      x.fillRect(0, 0, 900, 1740);
      x.textAlign = 'center';
      x.fillStyle = '#16191f';
      x.font = '43px Arial';
      x.fillText(form.blueTitle || 'Payment to', 450, 145);

      x.strokeStyle = '#edf0f4';
      x.lineWidth = 3;
      x.beginPath();
      x.arc(450, 330, 82, 0, Math.PI * 2);
      x.stroke();
      x.strokeStyle = '#155eef';
      x.lineWidth = 9;
      x.beginPath();
      x.roundRect(405, 305, 92, 58, 8);
      x.stroke();
      x.beginPath();
      x.moveTo(420, 305);
      x.lineTo(420, 289);
      x.lineTo(484, 289);
      x.stroke();
      x.fillStyle = '#155eef';
      x.beginPath();
      x.arc(478, 334, 5, 0, Math.PI * 2);
      x.fill();

      x.fillStyle = '#181b21';
      x.font = '34px Arial';
      const address = form.blueAddress || 'Sample wallet address';
      const midpoint = Math.ceil(address.length / 2);
      const splitAt = address.lastIndexOf('0', midpoint) > 12 ? address.lastIndexOf('0', midpoint) : midpoint;
      x.fillText(address.slice(0, splitAt), 450, 500);
      x.fillText(address.slice(splitAt), 450, 542);

      x.font = `800 86px ${amountFamily}`;
      x.fillText(form.blueFiat || '$0.00', 450, 885);
      x.fillStyle = '#344054';
      x.font = `700 40px ${amountFamily}`;
      x.fillText(form.blueCrypto || '0 ETH', 450, 980);

      x.textAlign = 'left';
      x.fillStyle = '#344054';
      x.font = '39px Arial';
      x.fillText('Amount', 62, 1230);
      x.fillText('Network Fee', 62, 1430);
      x.fillText('Confirmed', 62, 1625);
      x.textAlign = 'right';
      x.fillStyle = '#111318';
      x.font = `800 39px ${amountFamily}`;
      x.fillText(form.blueFiat || '$0.00', 838, 1230);
      x.fillText(form.blueFeeFiat || '$0.00', 838, 1430);
      x.fillText(form.blueConfirmed || 'Demo date', 838, 1625);
      x.fillStyle = '#344054';
      x.font = `600 34px ${amountFamily}`;
      x.fillText(form.blueCrypto || '0 ETH', 795, 1282);
      x.fillText(form.blueFeeCrypto || '0 ETH', 795, 1482);
      x.fillStyle = '#627eea';
      x.beginPath();
      x.arc(821, 1272, 19, 0, Math.PI * 2);
      x.arc(821, 1472, 19, 0, Math.PI * 2);
      x.fill();
    } else if (template.id === 'indigo') {
      const centeredLines = (text: string, maxWidth: number, maxLines = 3) => {
        const words = text.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
          const candidate = line ? `${line} ${word}` : word;
          if (line && x.measureText(candidate).width > maxWidth) {
            lines.push(line);
            line = word;
          } else line = candidate;
        }
        if (line) lines.push(line);
        return lines.slice(0, maxLines);
      };
      x.fillStyle = '#fff';
      x.fillRect(0, 0, 900, 1947);
      x.fillStyle = '#08090b';
      x.textAlign = 'left';
      x.font = '700 27px Arial';
      x.fillText('4:19', 56, 54);
      [8, 13, 18, 23].forEach((height, index) => {
        x.fillRect(636 + index * 10, 55 - height, 7, height);
      });
      x.strokeStyle = '#08090b';
      x.lineWidth = 4;
      x.lineCap = 'round';
      [22, 14].forEach((radius) => {
        x.beginPath();
        x.arc(704, 51, radius, Math.PI * 1.18, Math.PI * 1.82);
        x.stroke();
      });
      x.beginPath();
      x.arc(704, 52, 3, 0, Math.PI * 2);
      x.fill();
      x.textAlign = 'center';
      x.font = '700 19px Arial';
      x.fillText('◴', 750, 54);
      x.textAlign = 'right';
      x.font = '22px Arial';
      x.fillText('33%', 813, 54);
      x.strokeStyle = '#555b63';
      x.lineWidth = 2.5;
      x.strokeRect(824, 32, 48, 25);
      x.fillStyle = '#555b63';
      x.fillRect(873, 39, 4, 11);
      x.fillStyle = '#08090b';
      x.fillRect(828, 36, 13, 17);
      x.fillStyle = '#f7f8fa';
      x.fillRect(0, 82, 900, 100);
      x.strokeStyle = '#edf0f4';
      x.beginPath();
      x.moveTo(0, 182);
      x.lineTo(900, 182);
      x.stroke();
      x.fillStyle = '#111318';
      x.textAlign = 'center';
      x.font = '600 32px Arial';
      x.fillText('Confirmation', 450, 145);
      x.fillStyle = '#55ad67';
      x.beginPath();
      x.arc(450, 292, 58, 0, Math.PI * 2);
      x.fill();
      x.strokeStyle = '#fff';
      x.lineWidth = 12;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(420, 292);
      x.lineTo(442, 316);
      x.lineTo(486, 264);
      x.stroke();
      x.fillStyle = '#15171c';
      x.font = '32px Arial';
      centeredLines(form.indigoMessage || 'Sample confirmation message', 760, 3).forEach((entry, index) =>
        x.fillText(entry, 450, 438 + index * 43),
      );
      x.font = '300 72px Arial';
      x.fillText(form.indigoAmount || '$0.00', 450, 635);
      x.fillStyle = '#9c9fa4';
      x.beginPath();
      x.arc(450, 770, 58, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#fff';
      x.font = '300 49px Arial';
      x.fillText((form.indigoName || 'D').trim().charAt(0).toUpperCase(), 450, 787);
      x.fillStyle = '#6d1cc5';
      x.font = '900 34px Arial';
      x.fillText('z', 500, 817);
      x.fillStyle = '#17191e';
      x.font = '39px Arial';
      x.fillText(form.indigoName || 'Demo recipient', 450, 886);
      x.font = '26px Arial';
      x.fillText(form.indigoRegistered || 'Registered as sample', 450, 932);
      x.fillText(form.indigoPhone || '(000) 000-0000', 450, 969);
      x.font = '30px Arial';
      centeredLines(form.indigoSiri || 'Sample shortcut message', 790, 3).forEach((entry, index) =>
        x.fillText(entry, 450, 1092 + index * 40),
      );
      x.strokeStyle = '#aeb3b9';
      x.lineWidth = 2;
      x.beginPath();
      x.roundRect(280, 1208, 340, 104, 8);
      x.stroke();
      const siriGradient = x.createLinearGradient(310, 1235, 366, 1290);
      siriGradient.addColorStop(0, '#55b9ff');
      siriGradient.addColorStop(.45, '#9b50c9');
      siriGradient.addColorStop(1, '#ec5d93');
      x.fillStyle = siriGradient;
      x.beginPath();
      x.arc(342, 1260, 31, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#15171c';
      x.font = 'bold 31px Arial';
      x.fillText(form.indigoSiriButton || 'Add to Siri', 492, 1272);
      x.fillStyle = '#2f66b8';
      x.beginPath();
      x.roundRect(42, 1770, 816, 95, 7);
      x.fill();
      x.fillStyle = '#fff';
      x.font = '36px Arial';
      x.fillText(form.indigoDone || 'Done', 450, 1831);
      x.fillStyle = '#07080a';
      x.beginPath();
      x.roundRect(305, 1918, 290, 9, 8);
      x.fill();
    } else if (template.id === 'black') {
      drawBybitReceipt(c, form);
    } else if (template.id === 'dark-blue') {
      const img = new Image();
      img.src = '/receiptlab/dark-blue-reference.jpg';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
      });
      x.drawImage(img, 0, 0, 900, 1600);
      x.textAlign = 'center';
      x.fillStyle = '#222431';
      x.fillRect(165, 50, 570, 95);
      x.fillRect(265, 145, 370, 75);
      x.fillRect(45, 225, 810, 120);
      x.fillStyle = '#f5f5f6';
      x.font = 'bold 58px Arial';
      x.fillText(form.darkBlueAmount || '+0 USDT', 450, 126);
      x.fillStyle = '#29bd8b';
      x.font = 'bold 37px Arial';
      x.fillText(`✓ ${form.darkBlueStatus || 'Completed'}`, 450, 207);
      x.fillStyle = '#8c8e98';
      x.font = '29px Arial';
      const darkMessage = form.darkBlueMessage || 'Sample deposit message';
      const darkWords = darkMessage.split(' ');
      const darkLines: string[] = [];
      let darkLine = '';
      for (const word of darkWords) {
        const candidate = darkLine ? `${darkLine} ${word}` : word;
        if (x.measureText(candidate).width > 810 && darkLine) {
          darkLines.push(darkLine);
          darkLine = word;
        } else {
          darkLine = candidate;
        }
      }
      if (darkLine) darkLines.push(darkLine);
      darkLines.slice(0, 2).forEach((entry, index) =>
        x.fillText(entry, 450, 274 + index * 40),
      );
      x.fillStyle = '#353527';
      x.fillRect(775, 449, 82, 55);
      x.fillStyle = '#f0c844';
      x.font = 'bold 30px Arial';
      x.fillText(form.darkBlueNetwork || 'ETH', 816, 487);
      x.fillStyle = '#222431';
      x.fillRect(300, 535, 560, 125);
      x.fillRect(380, 675, 480, 115);
      x.fillRect(420, 810, 440, 72);
      x.fillRect(390, 902, 470, 72);
      x.fillStyle = '#f4f4f5';
      x.textAlign = 'right';
      x.font = '32px Arial';
      const address = form.darkBlueAddress || 'sample-address';
      const addressSplit = Math.ceil(address.length / 2);
      x.fillText(address.slice(0, addressSplit), 840, 584);
      x.fillText(address.slice(addressSplit), 840, 631);
      const txid = form.darkBlueTxid || 'Sample transaction';
      const txidWords = txid.split(' ');
      const txidMid = Math.ceil(txidWords.length / 2);
      x.fillText(txidWords.slice(0, txidMid).join(' '), 840, 721);
      x.fillText(txidWords.slice(txidMid).join(' '), 840, 763);
      x.fillText(form.darkBlueWallet || 'Sample Wallet', 840, 856);
      x.fillText(form.darkBlueDate || 'Demo date', 840, 949);
    } else {
      x.fillStyle = '#fff';
      x.fillRect(0, 0, 900, 1200);
      x.fillStyle = template.accent;
      x.fillRect(0, 0, 900, 18);
      x.textAlign = 'center';
      x.fillStyle = '#111827';
      x.font = 'bold 36px Arial';
      x.fillText(form.merchant || 'Demo merchant', 450, 105);
      x.fillStyle = '#c52233';
      x.font = 'bold 25px Arial';
      x.fillText('DEMO / SAMPLE / NOT A REAL TRANSACTION', 450, 165);
      x.textAlign = 'left';
      x.fillStyle = '#6b7280';
      x.font = '22px Arial';
      x.fillText(form.date, 75, 250);
      x.fillStyle = '#111827';
      x.fillText(form.item, 75, 365);
      x.textAlign = 'right';
      x.fillText(`$${Number(form.amount || 0).toFixed(2)}`, 825, 365);
      x.textAlign = 'left';
      x.font = 'bold 34px Arial';
      x.fillText('Total', 75, 520);
      x.textAlign = 'right';
      x.fillText(`$${total}`, 825, 520);
    }
    if ((watermarkEnabled || requiresSampleNotice) && template.id !== 'black') {
      x.save();
      x.globalAlpha = 1;
      x.fillStyle = '#fff3cd';
      x.fillRect(0, contentHeight, 900, safetyFooterHeight);
      x.fillStyle = '#d69e00';
      x.fillRect(0, contentHeight, 900, 2);
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillStyle = '#9f1239';
      x.font = 'bold 21px Arial';
      x.fillText(
        'DEMO • NOT A REAL TRANSACTION',
        450,
        contentHeight + safetyFooterHeight / 2 + 1,
      );
      x.restore();
    }
    const url = c.toDataURL();
    if (type === 'png') {
      const a = document.createElement('a');
      a.download = 'receiptlab-demo-sample.png';
      a.href = url;
      a.click();
    } else {
      const pdfUrl = URL.createObjectURL(canvasToPdfBlob(c));
      const a = document.createElement('a');
      a.download = `receiptlab-${template.id}-sample.pdf`;
      a.href = pdfUrl;
      a.click();
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    }
    await saveReceipt('Exported', true);
    notify(`${type.toUpperCase()} sample ready`);
  }
  if (false && !authReady)
    return (
      <div className="app-loading">
        <ReceiptText />
        <span>Connecting securely…</span>
      </div>
    );
  if (false && !user)
    return (
      <Auth
        register={register}
        dark={dark}
        theme={() => setDark(!dark)}
        mode={() => {
          setRegister(!register);
          setAuthError('');
        }}
        submit={submitAuth}
        reset={resetPassword}
        busy={authBusy}
        error={authError}
        configured={firebaseConfigured}
      />
    );
  const nav = [
    ['dashboard', 'Overview', LayoutDashboard],
    ['templates', 'Templates', Sparkles],
    ['editor', 'Receipt editor', ReceiptText],
    ['history', 'History', History],
    ['admin', 'Admin', ShieldCheck],
  ] as const;
  return (
    <div className={`receiptlab-root ${coinbaseAmountFont.variable} ${dark ? 'dark' : ''}`}>
      <div className="shell">
        <aside className={`sidebar ${mobile ? 'open' : ''}`}>
          <div className="brand">
            <i>
              <ReceiptText />
            </i>
            <span>
              ReceiptLab<small>DEMO STUDIO</small>
            </span>
            <button className="close" onClick={() => setMobile(false)}>
              <X />
            </button>
          </div>
          <nav>
            {nav.map(([id, label, I]) => (
              <button
                className={view === id ? 'active' : ''}
                onClick={() => go(id)}
                key={id}
              >
                <I />
                {label}
              </button>
            ))}
          </nav>
          <div className="safe">
            <ShieldCheck />
            <b>Demo-safe by design</b>
            <p>Use the editor toggle to show or hide the sample watermark.</p>
          </div>
          <div className="profile">
            <i>{userInitials(displayName)}</i>
            <span>
              <b>{displayName}</b>
              <small>{user?.email}</small>
            </span>
            <button
              className="logout"
              aria-label="Sign out"
              onClick={() => auth && signOut(auth)}
            >
              <LogOut />
            </button>
          </div>
        </aside>
        <main>
          <header>
            <button className="menu" onClick={() => setMobile(true)}>
              <Menu />
            </button>
            <div className="crumb">
              <small>Workspace</small>
              <b>
                {view === 'editor'
                  ? 'Receipt editor'
                  : view[0].toUpperCase() + view.slice(1)}
              </b>
            </div>
            <div className="actions">
              <button className="icon" onClick={() => setDark(!dark)}>
                {dark ? <Sun /> : <Moon />}
              </button>
              <button className="primary" onClick={() => go('editor')}>
                <Plus />
                New receipt
              </button>
            </div>
          </header>
          {view === 'dashboard' && (
            <Dashboard go={go} rows={historyRows} name={displayName} />
          )}{' '}
          {view === 'templates' && (
            <Gallery
              selected={template}
              choose={(t) => {
                setTemplate(t);
                go('editor');
              }}
            />
          )}
          {view === 'editor' && (
            <Editor
              form={form}
              setForm={setForm}
              template={template}
              setTemplate={setTemplate}
              total={total}
              watermarkEnabled={watermarkEnabled}
              setWatermarkEnabled={setWatermarkEnabled}
              receiptRef={ref}
              exp={exportFile}
              save={() => saveReceipt('Draft')}
              invoiceLogo={invoiceLogo}
              setInvoiceLogo={setInvoiceLogo}
            />
          )}{' '}
          {view === 'history' && (
            <HistoryPage
              query={query}
              setQuery={setQuery}
              rows={historyRows.filter((r) =>
                (r.title + r.id + r.template)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )}
              edit={() => go('editor')}
            />
          )}{' '}
          {view === 'admin' && <Admin notify={notify} />}
        </main>
        {mobile && (
          <button
            className="scrim"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          />
        )}{' '}
        {toast && (
          <div className="toast">
            <ShieldCheck />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
function Auth({
  register,
  dark,
  theme,
  mode,
  submit,
  reset,
  busy,
  error,
  configured,
}: {
  register: boolean;
  dark: boolean;
  theme: () => void;
  mode: () => void;
  submit: (details: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  reset: (email: string) => Promise<void>;
  busy: boolean;
  error: string;
  configured: boolean;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className={`receiptlab-root ${coinbaseAmountFont.variable} ${dark ? 'dark' : ''}`}>
      <div className="auth">
        <section className="auth-art">
          <div className="logo">
            <ReceiptText />
            ReceiptLab
          </div>
          <div className="pitch">
            <span>DESIGN RESPONSIBLY</span>
            <h1>
              Beautiful receipt concepts.
              <br />
              <em>Clearly fictional.</em>
            </h1>
            <p>
              Create polished demo receipts for mockups, product demos, and
              creative presentations—never for real transactions.
            </p>
            <div>
              <ShieldCheck />
              <b>
                Permanent safety marking
                <small>
                  Every output says DEMO / SAMPLE / NOT A REAL TRANSACTION.
                </small>
              </b>
            </div>
          </div>
        </section>
        <section className="auth-panel">
          <button className="theme" aria-label="Toggle color theme" onClick={theme}>
            {dark ? <Sun /> : <Moon />}
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit({ name, email, password });
            }}
          >
            <i>
              <CreditCard />
            </i>
            <span className="eyebrow">CREATOR DASHBOARD</span>
            <h2>{register ? 'Create your account' : 'Welcome back'}</h2>
            <p>
              {register ? 'Already a member?' : 'New to ReceiptLab?'}{' '}
              <button type="button" onClick={mode}>
                {register ? 'Sign in' : 'Create an account'}
              </button>
            </p>
            {register && (
              <label>
                Full name
                <input
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex Morgan"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="alex@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={6}
                required
                autoComplete={register ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
            </label>
            <div className="auth-row">
              <label>
                <input type="checkbox" /> Remember me
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => reset(email)}
              >
                Forgot password?
              </button>
            </div>
            {!configured && (
              <output className="auth-message warning">
                Firebase environment variables are required before sign-in can
                work.
              </output>
            )}
            {error && (
              <p className="auth-message" role="alert" aria-live="polite">
                {error}
              </p>
            )}
            <button className="primary submit" disabled={busy || !configured}>
              {busy
                ? 'Please wait…'
                : register
                  ? 'Create account'
                  : 'Sign in to dashboard'}
            </button>
            <aside>
              <ShieldCheck />
              Demo content only. No real financial records.
            </aside>
          </form>
          <footer>© 2026 ReceiptLab · Sample studio</footer>
        </section>
      </div>
    </div>
  );
}
function Dashboard({
  go,
  rows,
  name,
}: {
  go: (v: View) => void;
  rows: HistoryRow[];
  name: string;
}) {
  return (
    <div className="content">
      <section className="welcome">
        <div>
          <span className="eyebrow">SATURDAY, AUGUST 30</span>
          <h1>Good morning, {name.split(' ')[0]}.</h1>
          <p>
            Your demo studio is ready. Create something unmistakably fictional.
          </p>
        </div>
        <button className="primary" onClick={() => go('editor')}>
          <Plus />
          Create a sample
        </button>
      </section>
      <div className="stats">
        <Stat
          icon={<ReceiptText />}
          label="Demo receipts"
          value={String(rows.length)}
          detail="Saved in Firebase"
        />
        <Stat
          icon={<Download />}
          label="Exports"
          value={String(rows.filter((row) => row.status === 'Exported').length)}
          detail="PNG & PDF"
        />
        <Stat
          icon={<Sparkles />}
          label="Templates"
          value={String(templates.length)}
          detail="All available"
        />
      </div>
      <section className="panel">
        <Title title="Start creating" text="Choose a workflow to begin." />
        <div className="quick">
          <Quick
            icon={<Plus />}
            title="New receipt"
            text="Start with your last template"
            click={() => go('editor')}
          />
          <Quick
            icon={<Sparkles />}
            title="Browse templates"
            text="Explore receipts and professional invoices"
            click={() => go('templates')}
          />
          <Quick
            icon={<Archive />}
            title="Import draft"
            text="Continue a saved concept"
          />
        </div>
      </section>
      <section className="panel">
        <Title
          title="Recent samples"
          text="Your latest fictional receipt concepts."
        />
        {rows.length ? (
          <Table rows={rows.slice(0, 2)} />
        ) : (
          <div className="empty compact">
            <ReceiptText />
            <h3>No saved receipts yet</h3>
            <p>Create or export a demo receipt to add it here.</p>
          </div>
        )}
      </section>
    </div>
  );
}
function Stat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="stat">
      <i>{icon}</i>
      <span>
        <small>{label}</small>
        <b>{value}</b>
        <em>{detail}</em>
      </span>
    </div>
  );
}
function Title({ title, text }: { title: string; text: string }) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}
function Quick({
  icon,
  title,
  text,
  click,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  click?: () => void;
}) {
  return (
    <button onClick={click}>
      <i>{icon}</i>
      <b>{title}</b>
      <small>{text}</small>
    </button>
  );
}
function Gallery({
  selected,
  choose,
}: {
  selected: Template;
  choose: (t: Template) => void;
}) {
  return (
    <div className="content">
      <PageTitle
        over="TEMPLATE LIBRARY"
        title="Choose your starting point"
        text="Original layouts for mockups, prototypes, and presentations."
      />
      <div className="gallery">
        {templates.map((t) => (
          <button
            className={selected.id === t.id ? 'selected' : ''}
            onClick={() => choose(t)}
            key={t.id}
          >
            <div
              className={`mini mini-${t.id}`}
              style={{ '--accent': t.accent } as React.CSSProperties}
            >
              {isInvoiceTemplate(t.id) ? (
                <InvoiceMini id={t.id} />
              ) : t.id === 'studio' ||
              t.id === 'mono' ||
              t.id === 'citrus' ||
              t.id === 'orbit' ||
              t.id === 'blue' ||
              t.id === 'indigo' ||
              t.id === 'black' ||
              t.id === 'dark-blue' ||
              t.id === 'boa' ||
              t.id === 'citi-bank' ||
              t.id === 'wells-fargo' ||
              t.id === 'chase' ||
              t.id === 'gcash' ||
              t.id === 'okx' ? (
                <>
                  <img
                    src={
                      t.id === 'studio'
                        ? '/receiptlab/cashapp-library-preview.jpeg'
                        : t.id === 'mono'
                          ? '/receiptlab/paypal-library-preview.jpeg'
                          : t.id === 'citrus'
                            ? '/receiptlab/trust-wallet-library-preview.png'
                            : t.id === 'orbit'
                              ? '/receiptlab/venmo-library-preview.png'
                              : t.id === 'blue'
                                ? '/receiptlab/coinbase-library-preview.jpeg'
                                : t.id === 'indigo'
                                  ? '/receiptlab/zelle-library-preview.png'
                                    : t.id === 'black'
                                      ? '/receiptlab/bybit-library-preview.jpg'
                                      : t.id === 'dark-blue'
                                        ? '/receiptlab/binance-library-preview.png'
                                        : t.id === 'boa'
                                          ? '/receiptlab/boa-library-preview.png'
                                          : t.id === 'citi-bank'
                                            ? '/receiptlab/citi-library-preview.png'
                                      : t.id === 'wells-fargo'
                                              ? '/receiptlab/wells-fargo-library-preview.jpg'
                                              : t.id === 'chase'
                                                ? '/receiptlab/chase-preview-logo.png'
                                              : t.id === 'gcash'
                                                ? '/receiptlab/gcash-library-preview.png'
                                                : '/receiptlab/okx-preview-logo.png'
                    }
                    alt={`${t.name} receipt reference`}
                  />
                </>
              ) : (
                <>
                  <b>DEMO CO.</b>
                  <strong>DEMO / SAMPLE</strong>
                  <i />
                  <i />
                  <i />
                  <em>$128.50</em>
                  <small>NOT A REAL TRANSACTION</small>
                </>
              )}
            </div>
            <footer>
              <span>
                <b>{t.name}</b>
                <small>{t.description}</small>
              </span>
              <em>{t.category}</em>
            </footer>
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileReceiptMini({ id }: { id: 'gcash' | 'okx' }) {
  return id === 'gcash' ? (
    <div className="gcash-mini" aria-hidden="true">
      <b>Express Send</b>
      <div><i>✓</i><strong>HA•••D D.</strong><small>Sent via GCash</small><span>₱3000.00</span></div>
      <em>SAMPLE ONLY</em>
    </div>
  ) : (
    <div className="okx-mini" aria-hidden="true">
      <img className="okx-mini-logo" src="/receiptlab/okx-preview-logo.png" alt="" />
      <b>Withdrawal details</b>
      <small>Amount</small><strong>- 10.316428 USDT</strong><i>✓ Sent</i>
      <span /><span /><span /><span />
      <em>SAMPLE ONLY</em>
    </div>
  );
}

function ChaseReceiptMini() {
  return (
    <div className="chase-mini" aria-hidden="true">
      <header><img src="/receiptlab/chase-preview-logo.png" alt="Chase logo" /></header>
      <strong>Payment pending</strong>
      <section><small>You sent</small><b>$2,500,000.00</b></section>
      <span /><span /><span />
      <em>SAMPLE ONLY</em>
    </div>
  );
}

function GcashReceiptPreview({ form }: { form: Record<string, string> }) {
  return (
    <>
      <article className="gcash-screen">
        <div className="gcash-statusbar"><b>{form.gcashTime || '10:06'}</b><span>▮▮▮⌁▱</span></div>
        <header><b>Express Send</b><i>×</i></header>
        <div className="gcash-check">✓</div>
        <main className="gcash-paper">
          <h2>{form.gcashRecipient || 'HA•••D D.'}</h2>
          <strong className="gcash-phone">{form.gcashPhone || '+63 915 750 3350'}</strong>
          <p className="gcash-via">Sent via GCash</p>
          <dl className="gcash-values">
            <div><dt>Amount</dt><dd>{form.gcashAmount || '3,000.00'}</dd></div>
            <div><dt>Total Amount Sent</dt><dd>{form.gcashTotal || '₱3000.00'}</dd></div>
          </dl>
          <div className="gcash-meta"><span>Ref No. <b>{form.gcashReference || '9040035185241'}</b></span><b>{form.gcashDate || 'Apr 22, 2026 10:06 AM'}</b></div>
          <div className="gcash-carbon"><strong>♧ 279g <small>(gCO₂e)</small></strong><p>By going digital, you reduce your carbon footprint from transportation, paper, and plastic.</p></div>
        </main>
        <footer><span>⇩ <b>Download</b></span><span>⌯ <b>Share Receipt</b></span></footer>
      </article>
      <div className="watermark safety-footer">{MOBILE_SAMPLE_NOTICE}</div>
    </>
  );
}

function OkxReceiptPreview({ form }: { form: Record<string, string> }) {
  const rows = [
    ['Blockchain', form.okxBlockchain || 'TRC20'],
    ['Type', form.okxType || 'On-chain withdrawal'],
    ['Status', form.okxStatus || 'Sent'],
    ['Address/domain', form.okxAddress || 'sample-address', 'copy'],
    ['Transaction ID  ⓘ', form.okxTransaction || 'sample-transaction-id', 'copy'],
    ['Fee', form.okxFee || '1 USDT'],
    ['Time', form.okxTime || 'Demo date'],
    ['Reference no.', form.okxReference || '000000000', 'copy'],
  ];
  return (
    <>
      <article className="okx-screen">
        <div className="okx-statusbar"><b>19:23</b><span>▮▮▮⌁▱</span></div>
        <header><i>‹</i><b>Withdrawal details</b></header>
        <main>
          <small>Amount</small>
          <h2>{form.okxAmount || '- 10.316428 USDT'}</h2>
          <strong className="okx-sent">✓ <span>{form.okxStatus || 'Sent'}</span></strong>
          <section className="okx-callout"><i>◎</i><div><b>Crypto transferred out of OKX</b><span>{form.okxHelp || "Why hasn’t my transaction arrived?"}</span></div></section>
          <dl className="okx-details">{rows.map(([label, value, copy]) => <div key={label}><dt>{label}</dt><dd><span>{value}</span>{copy && <Copy aria-hidden="true" />}</dd></div>)}</dl>
        </main>
        <div className="okx-explorer">{form.okxButton || 'View on blockchain explorer'}</div>
      </article>
      <div className="watermark safety-footer">{MOBILE_SAMPLE_NOTICE}</div>
    </>
  );
}

function ChaseReceiptPreview({ form }: { form: Record<string, string> }) {
  const status = getChaseStatusPresentation(form.chaseStatus);
  return (
    <>
      <article className={`chase-screen chase-status-${status.key}`}>
        <header className="chase-header">
          <div className="chase-brand"><img src="/receiptlab/chase-receipt-logo.png" alt="Chase logo" /></div>
          <div><span>Receipt</span><b>{form.chaseReceiptDate || 'Demo date'}</b></div>
        </header>
        <section className="chase-pending">
          <i aria-hidden="true">{status.icon}</i>
          <div><b>{form.chaseStatusTitle || status.title}</b><span>{form.chaseStatusMessage || status.message}</span></div>
        </section>
        <section className="chase-sent">
          <span>You sent</span>
          <div><strong>{form.chaseAmount || '$0.00'}</strong><b>{form.chaseCurrency || 'USD'}</b></div>
        </section>
        <main className="chase-transaction">
          <h2>Transaction details</h2>
          <dl>
            <div className="chase-recipient-row"><dt>To</dt><dd><b>{form.chaseRecipient || 'Sample recipient'}</b><span>{form.chaseEmail || 'sample@example.com'}</span></dd></div>
            <div><dt>Transaction ID</dt><dd><b>{form.chaseTransactionId || 'SAMPLE-ID'}</b></dd></div>
            <div><dt>Date</dt><dd><b>{form.chaseDate || 'Demo date'}</b><span>{form.chaseTime || 'Demo time'}</span></dd></div>
            <div><dt>Payment method</dt><dd><b>{form.chaseMethod || 'Sample balance'}</b></dd></div>
            <div><dt>Status</dt><dd><mark><i>{status.icon}</i>{status.label}</mark></dd></div>
          </dl>
        </main>
        <section className="chase-breakdown">
          <h2>Amount breakdown</h2>
          <dl>
            <div><dt>Payment amount</dt><dd>{form.chaseAmount || '$0.00'} {form.chaseCurrency || 'USD'}</dd></div>
            <div><dt>Fee</dt><dd>{form.chaseFee || '$0.00'} {form.chaseCurrency || 'USD'}</dd></div>
            <div><dt>Total</dt><dd>{form.chaseTotal || '$0.00'} {form.chaseCurrency || 'USD'}</dd></div>
          </dl>
        </section>
        <p className="chase-footnote">▣ &nbsp; {status.footer}<br />Thank you for banking with Chase.</p>
      </article>
      <div className="watermark safety-footer">{MOBILE_SAMPLE_NOTICE}</div>
    </>
  );
}

function InvoiceMini({ id }: { id: InvoiceTemplateId }) {
  if (id === 'invoice-nova') {
    return (
      <div className="nova-bank-mini" aria-hidden="true">
        <b>✓</b><strong>$500.00</strong><span>Jane Truong</span><i>From&nbsp; ANZ Pensioner Advantage</i><i>Message&nbsp; JtTF bw bank pay</i><small>733132-536139</small>
        <img src="/receiptlab/anz-logo.png" alt="" />
      </div>
    );
  }
  if (id === 'invoice-ledger') {
    return (
      <div className="ledger-payment-mini" aria-hidden="true">
        <b>✓</b><strong>Sent!</strong><span>PHP <i>950.00</i></span><em>Total Amount&nbsp; PHP 960.00</em><small>To&nbsp; Flash Demon</small><small>Reference no.</small>
      </div>
    );
  }
  if (id === 'invoice-aurora') {
    return (
      <div className="aurora-payment-mini" aria-hidden="true">
        <b>AURORA</b>
        <small>PAYMENT CONFIRMATION</small>
        <span /><span /><span /><span />
        <i>SAMPLE</i>
      </div>
    );
  }
  return (
    <div className="invoice-mini-sheet" aria-hidden="true">
      <div className="invoice-mini-top">
        <i>NV</i>
        <b>INVOICE</b>
      </div>
      <div className="invoice-mini-meta"><span /><span /></div>
      <div className="invoice-mini-line invoice-mini-head" />
      <div className="invoice-mini-line" />
      <div className="invoice-mini-line short" />
      <strong>$1,998.75</strong>
      <small>SAMPLE INVOICE</small>
    </div>
  );
}

function InvoicePreview({
  id,
  form,
  logoUrl,
  watermarkEnabled,
}: {
  id: InvoiceTemplateId;
  form: Record<string, string>;
  logoUrl: string;
  watermarkEnabled: boolean;
}) {
  const totals = invoiceTotals(form);
  const money = (value: number) => invoiceMoney(value, form.invoiceCurrency);
  const initials = (form.invoiceBusiness || 'NV')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  if (id === 'invoice-nova') {
    return (
      <article className="nova-bank-document">
        <div className="nova-bank-status"><span aria-hidden="true">✓</span></div>
        <div className="nova-bank-amount"><strong>{form.novaCurrency || '$'}{form.novaAmount || '0.00'}</strong><b>{form.novaStatus || 'Completed'}</b></div>
        <div className="nova-bank-recipient"><strong>{form.novaRecipientName || 'Jane Truong'}</strong><span>BSB {form.novaRecipientBsb || '000000'}</span><span>Account {form.novaRecipientAccount || '000000'}</span></div>
        <div className="nova-bank-details">
          <div><small>From</small><strong>{form.novaFrom || 'Sample account'}</strong></div>
          <div><small>Message</small><strong>{form.novaMessage || 'Sample payment message'}</strong></div>
          <div><small>Ref.</small><strong>{form.novaReference || 'SAMPLE-REFERENCE'}</strong></div>
          <div><small>Date</small><strong>{form.novaDate || 'Demo date'}</strong></div>
          <div><small>Receipt no.</small><strong>{form.novaReceiptNumber || '000000'}</strong></div>
        </div>
        <div className="nova-bank-mark"><img src="/receiptlab/anz-logo.png" alt="ANZ" /></div>
        {watermarkEnabled && <div className="nova-bank-sample">DEMO • NOT A REAL TRANSACTION</div>}
      </article>
    );
  }
  if (id === 'invoice-ledger') {
    return (
      <article className="ledger-payment-document">
        <div className="ledger-payment-status"><span aria-hidden="true">✓</span><strong>{form.ledgerStatus || 'Sent!'}</strong></div>
        <div className="ledger-payment-amount"><small>{form.ledgerCurrency || 'PHP'}</small><b>{form.ledgerAmount || '0.00'}</b></div>
        <div className="ledger-payment-summary">
          <div><span>Service Fee</span><b>{form.ledgerCurrency || 'PHP'} {form.ledgerServiceFee || '0.00'}</b></div>
          <div className="ledger-total"><span>Total Amount</span><b>{form.ledgerCurrency || 'PHP'} {form.ledgerTotalAmount || '0.00'}</b></div>
          <div><span>Send Money via</span><b className="ledger-payment-method">{form.ledgerPaymentMethod || 'InstaPay'}</b></div>
        </div>
        <div className="ledger-payment-parties">
          <section><small>To</small><strong>{form.ledgerRecipientName || 'Flash Demon'}</strong><span>{form.ledgerRecipientDetails || 'G-Xchange, Inc. / Gcash'}</span><span>{form.ledgerRecipientAccount || '0000000000'}</span></section>
          <section><small>From</small><strong>{form.ledgerSenderName || 'Flash Demon'}</strong><span>{form.ledgerSenderAccount || '••••••5287'}</span></section>
        </div>
        <div className="ledger-payment-meta">
          <div><small>Created on</small><strong>{form.ledgerCreatedOn || 'Demo date'}</strong></div>
          <div><small>Reference no.</small><strong>{form.ledgerReferenceNumber || 'SAMPLE-REFERENCE'}</strong></div>
          <div><small>Invoice no.</small><strong>{form.ledgerInvoiceNumber || '000000'}</strong></div>
        </div>
        {watermarkEnabled && <div className="ledger-payment-sample">DEMO • NOT A REAL TRANSACTION</div>}
      </article>
    );
  }
  if (id === 'invoice-aurora') {
    return (
      <>
        <article className="aurora-payment-document">
          <header className="aurora-payment-header">
            {logoUrl ? <img src={logoUrl} alt="Payment brand logo" /> : <div className="aurora-payment-mark" aria-hidden="true">A</div>}
            <b>{form.invoiceBusiness || 'Bank Template'}</b>
            <small>PAYMENT CONFIRMATION</small>
          </header>
          <div className="aurora-payment-fields">
            <div><small>Payment date</small><strong>{form.auroraPaymentDate || 'Demo date'}</strong></div>
            <div><small>Bank name</small><strong>{form.auroraBankName || 'Sample bank'}</strong></div>
            <div><small>Account number</small><strong>{form.auroraAccountNumber || '0000000000'}</strong></div>
            <div><small>Your reference</small><strong>{form.auroraYourReference || 'FLASH DEMO'}</strong></div>
            <div><small>Recipient&apos;s reference</small><strong>{form.auroraRecipientReference || 'Sample recipient'}</strong></div>
            <div><small>Transaction number</small><strong className="aurora-payment-transaction">{form.auroraTransactionNumber || 'SAMPLE-TRANSACTION-ID'}</strong></div>
          </div>
          <div className="aurora-payment-notice"><span aria-hidden="true">i</span><p>{form.auroraNotice || 'You can share your proof of payment from payment history.'}</p></div>
          <div className="aurora-payment-actions"><button type="button">{form.auroraFinishLabel || 'Finish'}</button><button type="button">{form.auroraNewPaymentLabel || 'New payment'}</button></div>
          {watermarkEnabled && <div className="aurora-payment-sample">DEMO • NOT A REAL TRANSACTION</div>}
        </article>
      </>
    );
  }
  return (
    <>
      <article className="invoice-document" data-template={id}>
        <header className="invoice-top">
          <div className="invoice-brand">
            {logoUrl ? (
              <img src={logoUrl} alt="Business logo" />
            ) : (
              <i aria-label="Default business logo">{initials}</i>
            )}
            <span>
              <b>{form.invoiceBusiness || 'Nevora Studio'}</b>
              <small>{form.invoiceEmail || 'hello@example.com'}</small>
            </span>
          </div>
          <div className="invoice-heading">
            <h2>Invoice</h2>
            <p>#{form.invoiceNumber || 'INV-001'}</p>
          </div>
        </header>
        <section className="invoice-meta">
          <div>
            <small>Bill to</small>
            <b>{form.invoiceClient || 'Sample Client'}</b>
            <span>{form.invoiceClientEmail || 'client@example.com'}</span>
          </div>
          <dl>
            <div><dt>Issued</dt><dd>{form.invoiceIssueDate || 'Sample date'}</dd></div>
            <div><dt>Due</dt><dd>{form.invoiceDueDate || 'Sample date'}</dd></div>
          </dl>
        </section>
        <div className="invoice-items" role="table" aria-label="Invoice line items">
          <div className="invoice-items-head" role="row">
            <span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span>
          </div>
          <div className="invoice-item" role="row">
            <b>{form.invoiceDescription || 'Professional services'}</b>
            <span>{totals.quantity}</span>
            <span>{money(totals.unitPrice)}</span>
            <strong>{money(totals.subtotal)}</strong>
          </div>
        </div>
        <div className="invoice-summary">
          <dl>
            <div><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
            <div><dt>Tax ({totals.taxRate}%)</dt><dd>{money(totals.tax)}</dd></div>
            <div className="invoice-total"><dt>Total due</dt><dd>{money(totals.total)}</dd></div>
          </dl>
        </div>
        <footer className="invoice-notes">
          <small>Notes</small>
          <p>{form.invoiceNotes || 'Thank you for your business.'}</p>
        </footer>
        <div className="invoice-sample">SAMPLE INVOICE • NOT A REAL TRANSACTION</div>
      </article>
      <div className="watermark safety-footer">DEMO • NOT A REAL TRANSACTION</div>
    </>
  );
}

type EditorProps = {
  form: Record<string, string>;
  setForm: (value: Record<string, string>) => void;
  template: Template;
  setTemplate: (value: Template) => void;
  total: string;
  watermarkEnabled: boolean;
  setWatermarkEnabled: (value: boolean) => void;
  receiptRef: React.RefObject<HTMLDivElement | null>;
  exp: (type: 'png' | 'pdf') => Promise<void>;
  save: () => void;
  invoiceLogo: string;
  setInvoiceLogo: (value: string) => void;
};

function Editor({
  form,
  setForm,
  template,
  setTemplate,
  total,
  watermarkEnabled,
  setWatermarkEnabled,
  receiptRef,
  exp,
  save,
  invoiceLogo,
  setInvoiceLogo,
}: EditorProps) {
  const [logoError, setLogoError] = useState('');
  const field = (k: string, l: string) => (
    <label>
      {l}
      <input
        value={form[k] ?? ''}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
      />
    </label>
  );
  const invoice = isInvoiceTemplate(template.id);
  const lockedSample = template.id === 'black' || template.id === 'blue' || template.id === 'indigo' || template.id === 'gcash' || template.id === 'okx' || (invoice && template.id !== 'invoice-aurora');
  const handleLogo = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setLogoError('Choose a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Choose a logo smaller than 2 MB.');
      return;
    }
    setLogoError('');
    const reader = new FileReader();
    reader.onload = () => setInvoiceLogo(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };
  return (
    <div className="editor">
      <div className="editor-head">
        <div>
          <span className="eyebrow">LIVE EDITOR</span>
          <h1>Design your sample</h1>
        </div>
        <div>
          <button className="secondary" onClick={save}>
            Save draft
          </button>
          <button className="primary" onClick={() => exp('png')}>
            <Download />
            Export PNG
          </button>
        </div>
      </div>
      <div className="editor-grid">
        <section className="panel form">
          <div className="notice">
            <ShieldCheck />
            <span>
              <b>{lockedSample ? 'Sample notice is locked' : 'Safety watermark'}</b>
              <p>{lockedSample ? 'This template always includes a sample notice in previews and exports.' : 'Keep the sample notice on for safer sharing.'}</p>
            </span>
          </div>
          <label className="watermark-toggle">
            <span>
              <b>Show watermark</b>
              <small>Include the demo notice in previews and exports.</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={lockedSample || watermarkEnabled}
              disabled={lockedSample}
              onChange={(e) => setWatermarkEnabled(e.target.checked)}
              aria-label="Show watermark"
            />
          </label>
          <label>
            Template
            <select
              value={template.id}
              onChange={(e) =>
                setTemplate(
                  templates.find((t) => t.id === e.target.value) ?? templates[0],
                )
              }
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {invoice ? (
            <>
              {template.id !== 'invoice-ledger' && (
                <div className="invoice-logo-control">
                  <div className="invoice-logo-control-head">
                    <span>
                      <b>{template.id === 'invoice-aurora' ? 'Payment brand logo' : 'Business logo'}</b>
                      <small>PNG, JPG, or WebP · up to 2 MB</small>
                    </span>
                    {invoiceLogo && (
                      <button type="button" onClick={() => setInvoiceLogo('')}>
                        <Trash2 aria-hidden="true" /> Remove
                      </button>
                    )}
                  </div>
                  <label className="logo-upload">
                    {invoiceLogo ? <img src={invoiceLogo} alt="Uploaded business logo" /> : <ImagePlus aria-hidden="true" />}
                    <span>{invoiceLogo ? 'Replace logo' : 'Add your logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        handleLogo(event.target.files?.[0]);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {logoError && <p className="logo-error" role="alert">{logoError}</p>}
                </div>
              )}
              {template.id === 'invoice-aurora' ? (
                <>
                  <div className="row">
                    {field('invoiceBusiness', 'Template brand')}
                    {field('auroraPaymentDate', 'Payment date')}
                  </div>
                  {field('auroraBankName', 'Bank name')}
                  {field('auroraAccountNumber', 'Account number')}
                  <div className="row">
                    {field('auroraYourReference', 'Your reference')}
                    {field('auroraRecipientReference', "Recipient's reference")}
                  </div>
                  {field('auroraTransactionNumber', 'Transaction number')}
                  {field('auroraNotice', 'Information notice')}
                  <div className="row">
                    {field('auroraFinishLabel', 'Finish button label')}
                    {field('auroraNewPaymentLabel', 'New payment label')}
                  </div>
                </>
              ) : template.id === 'invoice-ledger' ? (
                <>
                  <div className="row">
                    {field('ledgerStatus', 'Status')}
                    {field('ledgerPaymentMethod', 'Payment method')}
                  </div>
                  <div className="row three">
                    {field('ledgerCurrency', 'Currency')}
                    {field('ledgerAmount', 'Amount')}
                    {field('ledgerServiceFee', 'Service fee')}
                  </div>
                  {field('ledgerTotalAmount', 'Total amount')}
                  <div className="row">
                    {field('ledgerRecipientName', 'Recipient name')}
                    {field('ledgerRecipientAccount', 'Recipient account')}
                  </div>
                  {field('ledgerRecipientDetails', 'Recipient details')}
                  <div className="row">
                    {field('ledgerSenderName', 'Sender name')}
                    {field('ledgerSenderAccount', 'Sender account')}
                  </div>
                  {field('ledgerCreatedOn', 'Created on')}
                  <div className="row">
                    {field('ledgerReferenceNumber', 'Reference number')}
                    {field('ledgerInvoiceNumber', 'Invoice number')}
                  </div>
                </>
              ) : template.id === 'invoice-nova' ? (
                <>
                  <div className="row">
                    {field('novaStatus', 'Status')}
                    {field('novaCurrency', 'Currency symbol')}
                  </div>
                  {field('novaAmount', 'Amount')}
                  <div className="row">
                    {field('novaRecipientName', 'Recipient name')}
                    {field('novaRecipientBsb', 'Recipient BSB')}
                  </div>
                  {field('novaRecipientAccount', 'Recipient account')}
                  {field('novaFrom', 'From account')}
                  {field('novaMessage', 'Message')}
                  {field('novaReference', 'Reference')}
                  <div className="row">
                    {field('novaDate', 'Date')}
                    {field('novaReceiptNumber', 'Receipt number')}
                  </div>
                </>
              ) : (
                <>
                  <div className="row">
                    {field('invoiceBusiness', 'Business name')}
                    {field('invoiceEmail', 'Business email')}
                  </div>
                  <div className="row">
                    {field('invoiceNumber', 'Invoice number')}
                    {field('invoiceCurrency', 'Currency code')}
                  </div>
                  <div className="row">
                    {field('invoiceClient', 'Client name')}
                    {field('invoiceClientEmail', 'Client email')}
                  </div>
                  <div className="row">
                    {field('invoiceIssueDate', 'Issue date')}
                    {field('invoiceDueDate', 'Due date')}
                  </div>
                  {field('invoiceDescription', 'Service description')}
                  <div className="row three">
                    {field('invoiceQuantity', 'Quantity')}
                    {field('invoiceUnitPrice', 'Unit price')}
                    {field('invoiceTaxRate', 'Tax %')}
                  </div>
                  {field('invoiceNotes', 'Notes')}
                </>
              )}
            </>
          ) : template.id === 'citi-bank' ? (<><>{field('citiName', 'Customer name')}{field('citiConfirmation', 'Confirmation number')}{field('citiSource', 'Payment source')}<div className="row">{field('citiSourceEnding', 'Source account ending')}{field('citiAmount', 'Payment amount')}</div>{field('citiDate', 'Payment date')}<div className="row">{field('citiPayTo', 'Payment to')}{field('citiPayToEnding', 'Payee account ending')}</div></></>) : template.id === 'wells-fargo' ? (<><>{field('wellsRecipient', 'Recipient name')}{field('wellsRecipientAccount', 'Recipient account')}{field('wellsSource', 'Source account')}<div className="row">{field('wellsAmount', 'Amount')}{field('wellsFees', 'Fees')}</div>{field('wellsTotal', 'Total from account')}<div className="row">{field('wellsSendDate', 'Send on')}{field('wellsDeliverDate', 'Deliver by')}</div>{field('wellsMessage', "Message to recipient's bank")}<div className="row">{field('wellsStatus', 'Status')}{field('wellsConfirmation', 'Confirmation number')}</div></></>) : template.id === 'boa' ? (
            <>
              {field('boaBankCard', 'Bank and card label')}
              {field('boaCardType', 'Card type')}
              {field('boaPayFrom', 'Pay from')}
              <div className="row">{field('boaAmount', 'Amount')}{field('boaDeliverBy', 'Deliver by')}</div>
              <div className="row">{field('boaFrequency', 'Frequency')}{field('boaPaymentType', 'Payment type')}</div>
              {field('boaConfirmation', 'Confirmation')}
              {field('boaFooter', 'Footer message')}
            </>
          ) : template.id === 'studio' ? (
            <>
              {field('merchant', 'Recipient name')}
              {field('item', 'Payment handle')}
              <div className="row">
                {field('amount', 'Amount')}
                {field('date', 'Date and time')}
              </div>
            </>
          ) : template.id === 'mono' ? (
            <>
              {field('monoMessage', 'Message')}
              {field('monoRecipient', 'Recipient email')}
              <div className="row">
                {field('amount', 'Amount')}
                {field('monoCurrency', 'Currency')}
              </div>
            </>
          ) : template.id === 'citrus' ? (
            <>
              <div className="row">
                {field('citrusAmount', 'Crypto amount')}
                {field('citrusAsset', 'Asset')}
              </div>
              {field('citrusFiat', 'Fiat equivalent')}
              <div className="row">
                {field('citrusDate', 'Date and time')}
                {field('citrusStatus', 'Status')}
              </div>
              {field('citrusRecipient', 'Recipient')}
              {field('citrusFee', 'Network fee')}
            </>
          ) : template.id === 'orbit' ? (
            <>
              {field('orbitName', 'Recipient name')}
              {field('orbitNote', 'Payment note')}
              <div className="row">
                {field('orbitAmount', 'Amount')}
                {field('orbitStatus', 'Status')}
              </div>
              <div className="row">
                {field('orbitLikes', 'Likes')}
                {field('orbitComments', 'Comments')}
              </div>
              {field('orbitMethod', 'Payment method')}
              {field('orbitDate', 'Transaction date')}
              {field('orbitHandle', 'Paid to')}
            </>
          ) : template.id === 'blue' ? (
            <>
              {field('blueTitle', 'Heading')}
              {field('blueAddress', 'Recipient wallet address')}
              <div className="row">
                {field('blueFiat', 'Fiat amount')}
                {field('blueCrypto', 'Crypto amount')}
              </div>
              <div className="row">
                {field('blueFeeFiat', 'Network fee')}
                {field('blueFeeCrypto', 'Fee in crypto')}
              </div>
              {field('blueConfirmed', 'Confirmation date')}
            </>
          ) : template.id === 'indigo' ? (
            <>
              {field('indigoMessage', 'Sending message')}
              {field('indigoAmount', 'Amount')}
              {field('indigoName', 'Recipient name')}
              <div className="row">
                {field('indigoRegistered', 'Registered name')}
                {field('indigoPhone', 'Phone number')}
              </div>
              {field('indigoSiri', 'Siri shortcut message')}
              <div className="row">
                {field('indigoSiriButton', 'Siri button')}
                {field('indigoDone', 'Done button')}
              </div>
            </>
          ) : template.id === 'black' ? (
            <>
              {field('blackStatus', 'Status heading')}
              {field('blackAmount', 'Amount')}
              {field('blackPayTo', 'Receiver')}
              {field('blackBybitId', 'Bybit ID')}
              {field('blackMemo', 'Note')}
              {field('blackTime', 'Payment date')}
              {field('blackOrder', 'Order ID')}
              <div className="row">
                {field('blackShare', 'App button label')}
                {field('blackDone', 'Details button label')}
              </div>
            </>
          ) : template.id === 'dark-blue' ? (
            <>
              <div className="row">
                {field('darkBlueAmount', 'Amount')}
                {field('darkBlueStatus', 'Status')}
              </div>
              {field('darkBlueMessage', 'Confirmation message')}
              <div className="row">
                {field('darkBlueNetwork', 'Network')}
                {field('darkBlueWallet', 'Wallet')}
              </div>
              {field('darkBlueAddress', 'Address')}
              {field('darkBlueTxid', 'Transaction ID')}
              {field('darkBlueDate', 'Date')}
            </>
          ) : template.id === 'gcash' ? (
            <>
              <div className="row">
                {field('gcashTime', 'Phone time')}
                {field('gcashRecipient', 'Recipient name')}
              </div>
              {field('gcashPhone', 'Recipient phone')}
              <div className="row">
                {field('gcashAmount', 'Amount')}
                {field('gcashTotal', 'Total amount sent')}
              </div>
              <div className="row">
                {field('gcashReference', 'Reference number')}
                {field('gcashDate', 'Date and time')}
              </div>
            </>
          ) : template.id === 'okx' ? (
            <>
              <div className="row">
                {field('okxAmount', 'Amount')}
                {field('okxStatus', 'Status')}
              </div>
              {field('okxHelp', 'Help message')}
              <div className="row">
                {field('okxBlockchain', 'Blockchain')}
                {field('okxType', 'Withdrawal type')}
              </div>
              {field('okxAddress', 'Address or domain')}
              {field('okxTransaction', 'Transaction ID')}
              <div className="row">
                {field('okxFee', 'Fee')}
                {field('okxTime', 'Time')}
              </div>
              <div className="row">
                {field('okxReference', 'Reference number')}
                {field('okxButton', 'Explorer button')}
              </div>
            </>
          ) : template.id === 'chase' ? (
            <>
              <div className="row">
                {field('chaseReceiptDate', 'Receipt date')}
                <label>
                  Payment status
                  <select
                    value={getChaseStatusPresentation(form.chaseStatus).label}
                    onChange={(event) => {
                      const status = getChaseStatusPresentation(event.target.value);
                      setForm({
                        ...form,
                        chaseStatus: status.label,
                        chaseStatusTitle: status.title,
                        chaseStatusMessage: status.message,
                      });
                    }}
                  >
                    <option value="Successful">Successful</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>
              </div>
              {field('chaseStatusTitle', 'Status heading')}
              {field('chaseStatusMessage', 'Status message')}
              <div className="row">
                {field('chaseAmount', 'Amount')}
                {field('chaseCurrency', 'Currency')}
              </div>
              <div className="row">
                {field('chaseRecipient', 'Recipient name')}
                {field('chaseEmail', 'Recipient email')}
              </div>
              {field('chaseTransactionId', 'Transaction ID')}
              <div className="row">
                {field('chaseDate', 'Transaction date')}
                {field('chaseTime', 'Transaction time')}
              </div>
              {field('chaseMethod', 'Payment method')}
              <div className="row">
                {field('chaseFee', 'Fee')}
                {field('chaseTotal', 'Total')}
              </div>
            </>
          ) : (
            <>
              {field('merchant', 'Display name')}
              {field('date', 'Demo date')}
              <div className="row">
                {field('item', 'Item or service')}
                {field('amount', 'Demo amount')}
              </div>
              {field('tax', 'Demo tax')}
              {field('note', 'Footer note')}
            </>
          )}
          <div className="exports">
            <button onClick={() => exp('png')}>
              <FileImage />
              Download PNG
            </button>
            <button onClick={() => exp('pdf')}>
              <FileText />
              Print / save PDF
            </button>
          </div>
        </section>
        <section className="stage">
          <div className="stage-label">
            <span>Live preview</span>
            <span>100%</span>
          </div>
          <div
            ref={receiptRef}
            className={`receipt ${template.id} ${template.id === 'black' ? 'bybit-light' : lockedSample || watermarkEnabled ? 'with-safety-footer' : ''}`}
            style={{ '--accent': template.accent } as React.CSSProperties}
          >
            {template.id === 'citi-bank' ? (<article className="citi-bank-preview"><header><span>Make a Payment</span><b>ⓘ</b><h2>Thanks for Your Payment,<br />{form.citiName || 'CUSTOMER'}</h2></header><section className="citi-confirmation"><strong>✓</strong><div><small>CONFIRMATION NUMBER</small><b>{form.citiConfirmation || 'SAMPLE-CONFIRMATION'}</b></div></section><p className="citi-message">Your payment is scheduled. Look for a confirmation email in your inbox very soon.</p><p className="citi-another">Make Another Payment&nbsp; ›</p><div className="citi-details"><div><small>PAYMENT SOURCE</small><span>{form.citiSource || 'Bank account'}<em>Account ending in {form.citiSourceEnding || '0000'}</em></span></div><div><small>PAYMENT AMOUNT</small><span>{form.citiAmount || '$0.00'}</span></div><div><small>PAYMENT DATE</small><span>{form.citiDate || 'DEMO DATE'}</span></div><div><small>PAYMENT TO</small><span>{form.citiPayTo || 'Demo recipient'}<em>Account ending in {form.citiPayToEnding || '0000'}</em></span></div></div>{watermarkEnabled && <div className="watermark safety-footer">DEMO • NOT A REAL TRANSACTION</div>}</article>) : template.id === 'wells-fargo' ? (<article className="wells-fargo-preview"><header><strong>WELLS FARGO</strong></header><h2>Wire Money - Details</h2><div className="wells-details"><div><b>To</b><span>{form.wellsRecipient || 'Dana Pease'}<em>{form.wellsRecipientAccount || 'United States ...4204'}</em></span></div><div><b>From</b><span>{form.wellsSource || 'EVERYDAY CHECKING ...8928'}</span></div><div><b>Amount</b><span>{form.wellsAmount || '$23,073.67'}</span></div><div><b>Fees</b><span>{form.wellsFees || '$30.00'}</span></div><div><b>Total from<br />account</b><span>{form.wellsTotal || '$23,103.67'}</span></div><div><b>Send on</b><span>{form.wellsSendDate || '02/23/2022'}</span></div><div><b>Deliver by</b><span>{form.wellsDeliverDate || '02/23/2022'}</span></div><div><b>Message to<br />recipient&apos;s<br />bank</b><span>{form.wellsMessage || 'Pay off on 2 Acres'}</span></div><div><b>Status</b><span>{form.wellsStatus || 'Completed'}</span></div><div><b>Confirmation<br />number</b><span>{form.wellsConfirmation || 'OW00001992201633'}</span></div></div>{watermarkEnabled && <div className="watermark safety-footer">DEMO • NOT A REAL TRANSACTION</div>}</article>) : template.id === 'boa' ? (
              <article className="boa-preview">
                <div className="boa-success">Success</div>
                <h2>You&apos;ve scheduled a payment.</h2>
                <div className="boa-actions"><b>SAVE AS PDF</b><b>PRINT</b><b>EMAIL</b></div>
                <div className="boa-card">
                  <div className="boa-mark" aria-hidden="true">≋</div>
                  <div><strong>{form.boaBankCard || 'BANK OF AMERICA - PERSONAL CARD-9654'}</strong><span>{form.boaCardType || 'Financial Rewards Platinum Plus'}</span></div>
                </div>
                <div className="boa-details">
                  <div><b>Pay From</b><span>{form.boaPayFrom || 'Adv Plus Banking - 8599'}</span></div>
                  <div><b>Amount</b><span>{form.boaAmount || '$4,955.99'}</span></div>
                  <div><b>Deliver By</b><span>{form.boaDeliverBy || 'Mar 03, 2021'}</span></div>
                  <div><b>Frequency</b><span>{form.boaFrequency || 'One Time'}</span></div>
                  <div><b>Payment Type</b><span>{form.boaPaymentType || 'Electronic'}</span></div>
                  <div><b>Confirmation</b><span>{form.boaConfirmation || 'R9JFG-8F243'}</span></div>
                </div>
                <p className="boa-footer-copy">{form.boaFooter || 'Payments to this Bank of America Card/Small Business Loan account'}</p>
                <button className="boa-done" type="button">DONE</button>
                {watermarkEnabled && <div className="watermark safety-footer">DEMO • NOT A REAL TRANSACTION</div>}
              </article>
            ) : invoice ? (
              <InvoicePreview id={template.id as InvoiceTemplateId} form={form} logoUrl={invoiceLogo} watermarkEnabled={watermarkEnabled} />
            ) : template.id === 'studio' ? (
              <>
                <img
                  className="studio-fragment studio-avatar"
                  src="/receiptlab/studio-reference.jpg"
                  alt="CashApp receipt avatar"
                />
                <div className="studio-completed" aria-label="Completed">
                  <span aria-hidden="true">✓</span>
                  <strong>Completed</strong>
                </div>
                <div className="studio-copy studio-name">
                  {form.merchant || 'Demo name'}
                </div>
                <div className="studio-copy studio-handle">
                  Payment to {form.item || '$SampleUser'}
                </div>
                <div className="studio-copy studio-amount">
                  ${Number(form.amount || 0).toFixed(2)}
                </div>
                <div className="studio-copy studio-date">
                  {form.date || 'Demo date'}
                </div>
                {watermarkEnabled && (
                  <div className="watermark safety-footer">
                    DEMO • NOT A REAL TRANSACTION
                  </div>
                )}
              </>
            ) : template.id === 'mono' ? (
              <>
                <img
                  className="mono-reference"
                  src="/receiptlab/mono-reference.jpg"
                  alt="Paypal receipt reference"
                />
                <div className="mono-message">
                  <span>{form.monoMessage || "You've sent"}</span>
                  <span>
                    ${Number(form.amount || 0).toFixed(2)}{' '}
                    {form.monoCurrency || 'USD'} to
                  </span>
                  <span className="mono-recipient">
                    {form.monoRecipient || 'sample@example.com'}
                  </span>
                </div>
                {watermarkEnabled && (
                  <div className="watermark safety-footer">
                    DEMO • NOT A REAL TRANSACTION
                  </div>
                )}
              </>
            ) : template.id === 'citrus' ? (
              <>
                <img
                  className="citrus-reference"
                  src="/receiptlab/citrus-reference.jpg"
                  alt="Trust Wallet transfer reference"
                />
                <div className="citrus-top-value">
                  <strong>
                    {form.citrusAmount || '-50000'} {form.citrusAsset || 'BTC'}
                  </strong>
                  <span>{form.citrusFiat || '≈ $0.00'}</span>
                </div>
                <span className="citrus-value citrus-date">
                  {form.citrusDate || 'Demo date'}
                </span>
                <span className="citrus-value citrus-status">
                  {form.citrusStatus || 'Completed'}
                </span>
                <span className="citrus-value citrus-recipient">
                  {form.citrusRecipient || 'sample-address'}
                </span>
                <span className="citrus-value citrus-fee">
                  {form.citrusFee || '0 BTC ($0.00)'}
                </span>
                {watermarkEnabled && (
                  <div className="watermark safety-footer">
                    DEMO • NOT A REAL TRANSACTION
                  </div>
                )}
              </>
            ) : template.id === 'orbit' ? (
              <>
                <img
                  className="orbit-reference"
                  src="/receiptlab/orbit-reference.jpg"
                  alt="Venmo payment reference"
                />
                <span className="orbit-copy orbit-name">
                  {form.orbitName || 'Demo recipient'}
                </span>
                <span className="orbit-copy orbit-note">
                  {form.orbitNote || 'Sample payment'}
                </span>
                <span className="orbit-copy orbit-amount">
                  {form.orbitAmount || '- $0'}
                </span>
                <span className="orbit-copy orbit-likes">
                  {form.orbitLikes || '0'}
                </span>
                <span className="orbit-copy orbit-comments">
                  {form.orbitComments || '0'}
                </span>
                <span className="orbit-copy orbit-status">
                  {form.orbitStatus || 'Complete'}
                </span>
                <span className="orbit-copy orbit-method">
                  {form.orbitMethod || 'Sample balance'}
                </span>
                <span className="orbit-copy orbit-date">
                  {form.orbitDate || 'Demo date'}
                </span>
                <span className="orbit-copy orbit-handle">
                  {form.orbitHandle || '@SampleUser'}
                </span>
                {watermarkEnabled && (
                  <div className="watermark safety-footer">
                    DEMO • NOT A REAL TRANSACTION
                  </div>
                )}
              </>
            ) : template.id === 'blue' ? (
              <>
                <article className="coinbase-wallet-screen">
                  <h2>{form.blueTitle || 'Payment to'}</h2>
                  <div className="coinbase-wallet-icon" aria-hidden="true">
                    <i><b /></i>
                  </div>
                  <p className="coinbase-address">{form.blueAddress || 'Sample wallet address'}</p>
                  <div className="coinbase-primary-amount">
                    <strong>{form.blueFiat || '$0.00'}</strong>
                    <span>{form.blueCrypto || '0 ETH'}</span>
                  </div>
                  <dl className="coinbase-details">
                    <div>
                      <dt>Amount</dt>
                      <dd><strong>{form.blueFiat || '$0.00'}</strong><span>{form.blueCrypto || '0 ETH'} <i>♦</i></span></dd>
                    </div>
                    <div>
                      <dt>Network Fee</dt>
                      <dd><strong>{form.blueFeeFiat || '$0.00'}</strong><span>{form.blueFeeCrypto || '0 ETH'} <i>♦</i></span></dd>
                    </div>
                    <div>
                      <dt>Confirmed</dt>
                      <dd><strong>{form.blueConfirmed || 'Demo date'}</strong></dd>
                    </div>
                  </dl>
                </article>
                <div className="watermark safety-footer">
                  DEMO • NOT A REAL TRANSACTION
                </div>
              </>
            ) : template.id === 'indigo' ? (
              <>
                <article className="zelle-screen">
                  <div className="zelle-statusbar" aria-hidden="true">
                    <b>4:19</b>
                    <div className="zelle-phone-status">
                      <span className="zelle-cell"><i /><i /><i /><i /></span>
                      <span className="zelle-wifi"><i /><i /><i /></span>
                      <span className="zelle-alarm">◴</span>
                      <span className="zelle-battery-percent">33%</span>
                      <span className="zelle-battery"><i /></span>
                    </div>
                  </div>
                  <header className="zelle-header">Confirmation</header>
                  <main className="zelle-content">
                    <div className="zelle-check" aria-label="Payment confirmation">✓</div>
                    <p className="zelle-message">{form.indigoMessage || 'Sample confirmation message'}</p>
                    <strong className="zelle-amount">{form.indigoAmount || '$0.00'}</strong>
                    <div className="zelle-recipient-mark" aria-hidden="true"><span>{(form.indigoName || 'D').trim().charAt(0).toUpperCase()}</span><i>z</i></div>
                    <h3>{form.indigoName || 'Demo recipient'}</h3>
                    <p className="zelle-registered">{form.indigoRegistered || 'Registered as sample'}<span>{form.indigoPhone || '(000) 000-0000'}</span></p>
                    <p className="zelle-siri-copy">{form.indigoSiri || 'Sample shortcut message'}</p>
                    <div className="zelle-siri-action"><i aria-hidden="true" /><b>{form.indigoSiriButton || 'Add to Siri'}</b></div>
                  </main>
                  <div className="zelle-done">{form.indigoDone || 'Done'}</div>
                  <div className="zelle-homebar" aria-hidden="true" />
                </article>
                <div className="watermark safety-footer">SAMPLE ONLY • NOT A REAL TRANSACTION</div>
              </>
            ) : template.id === 'black' ? (
              <>
                <div className="bybit-content">
                  <div className="bybit-check" aria-hidden="true"><Check /></div>
                  <div className="bybit-status">{form.blackStatus || 'Success'}</div>
                  <div className="bybit-amount">{form.blackAmount || '0.00 USDT'}</div>
                  <dl className="bybit-details">
                    {bybitRows(form).map(({ label, value }) => (
                      <div className="bybit-row" key={label}>
                        <dt>{label}</dt>
                        <dd><span>{value}</span>{label === 'Order ID' && <Copy aria-hidden="true" />}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="bybit-actions" aria-label="Illustrative receipt actions">
                    <span><Download aria-hidden="true" />{form.blackShare || 'Download Bybit App'}</span>
                    <span>{form.blackDone || 'View details'}</span>
                  </div>
                </div>
                <div className="bybit-sample-notice">{BYBIT_SAMPLE_NOTICE}</div>
              </>
            ) : template.id === 'dark-blue' ? (
              <>
                <img
                  className="dark-blue-reference"
                  src="/receiptlab/dark-blue-reference.jpg"
                  alt="Binance deposit reference"
                />
                <span className="dark-blue-copy dark-blue-amount">
                  {form.darkBlueAmount || '+0 USDT'}
                </span>
                <span className="dark-blue-copy dark-blue-status">
                  ✓ {form.darkBlueStatus || 'Completed'}
                </span>
                <span className="dark-blue-copy dark-blue-message">
                  {form.darkBlueMessage || 'Sample deposit message'}
                </span>
                <span className="dark-blue-copy dark-blue-network">
                  {form.darkBlueNetwork || 'ETH'}
                </span>
                <span className="dark-blue-copy dark-blue-address">
                  {form.darkBlueAddress || 'sample-address'}
                </span>
                <span className="dark-blue-copy dark-blue-txid">
                  {form.darkBlueTxid || 'Sample transaction'}
                </span>
                <span className="dark-blue-copy dark-blue-wallet">
                  {form.darkBlueWallet || 'Sample Wallet'}
                </span>
                <span className="dark-blue-copy dark-blue-date">
                  {form.darkBlueDate || 'Demo date'}
                </span>
                {watermarkEnabled && (
                  <div className="watermark safety-footer">
                    DEMO • NOT A REAL TRANSACTION
                  </div>
                )}
              </>
            ) : template.id === 'gcash' ? (
              <GcashReceiptPreview form={form} />
            ) : template.id === 'okx' ? (
              <OkxReceiptPreview form={form} />
            ) : template.id === 'chase' ? (
              <ChaseReceiptPreview form={form} />
            ) : (
              <>
                <i className="bar" />
                <div className="r-head">
                  <i>{form.merchant?.[0] || 'D'}</i>
                  <h2>{form.merchant || 'Demo merchant'}</h2>
                  <p>Creative sample receipt</p>
                </div>
                <div className="stamp">
                  DEMO / SAMPLE / NOT A REAL TRANSACTION
                </div>
                <div className="meta">
                  <span>
                    Sample no.<b>SMP-1049</b>
                  </span>
                  <span>
                    Date<b>{form.date}</b>
                  </span>
                </div>
                <div className="line">
                  <span>
                    {form.item}
                    <small>Demo item</small>
                  </span>
                  <b>${Number(form.amount || 0).toFixed(2)}</b>
                </div>
                <div className="tax">
                  <span>Demo tax</span>
                  <b>${Number(form.tax || 0).toFixed(2)}</b>
                </div>
                <div className="total">
                  <span>Total</span>
                  <b>${total}</b>
                </div>
                <p className="note">{form.note}</p>
                <footer>
                  <ShieldCheck /> This document is a visual sample only.
                  <br />
                  It does not represent a purchase, payment, or transaction.
                </footer>
                {watermarkEnabled && (
                  <div className="watermark safety-footer">
                    DEMO • NOT A REAL TRANSACTION
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
function HistoryPage({
  query,
  setQuery,
  rows,
  edit,
}: {
  query: string;
  setQuery: (value: string) => void;
  rows: HistoryRow[];
  edit: () => void;
}) {
  return (
    <div className="content">
      <PageTitle
        over="YOUR LIBRARY"
        title="Generated receipt history"
        text="Find and reuse your fictional receipt concepts."
      />
      <section className="panel">
        <div className="search">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search samples, IDs, or templates…"
          />
          <button>
            <ChevronDown />
            All templates
          </button>
        </div>
        {rows.length ? (
          <Table rows={rows} edit={edit} />
        ) : (
          <div className="empty">
            <Search />
            <h3>No samples found</h3>
            <p>Try a different search term.</p>
          </div>
        )}
      </section>
    </div>
  );
}
function Table({ rows, edit }: { rows: HistoryRow[]; edit?: () => void }) {
  return (
    <div className="table">
      <table>
        <thead>
          <tr>
            <th>Sample</th>
            <th>Template</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <i>
                  <ReceiptText />
                </i>
                <span>
                  <b>{r.title}</b>
                  <small>{r.id}</small>
                </span>
              </td>
              <td>{r.template}</td>
              <td>{r.amount}</td>
              <td>{r.date}</td>
              <td>
                <em className={r.status.toLowerCase()}>{r.status}</em>
              </td>
              <td>
                <button onClick={edit}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Admin({ notify }: { notify: (s: string) => void }) {
  return (
    <div className="content">
      <div className="admin-head">
        <PageTitle
          over="ADMIN CONSOLE"
          title="Workspace control"
          text="Manage people, templates, and safety compliance."
        />
        <span>
          <ShieldCheck />
          Administrator
        </span>
      </div>
      <div className="stats">
        <Stat
          icon={<Users />}
          label="Active users"
          value="1,284"
          detail="+64 this month"
        />
        <Stat
          icon={<ReceiptText />}
          label="Samples created"
          value="8,492"
          detail="All demo-marked"
        />
        <Stat
          icon={<ShieldCheck />}
          label="Safety coverage"
          value="100%"
          detail="No overrides"
        />
      </div>
      <section className="panel">
        <div className="admin-title">
          <Title
            title="Template management"
            text="Published layouts available to creators."
          />
          <button
            className="primary"
            onClick={() => notify('Template creator opened')}
          >
            <Plus />
            Add template
          </button>
        </div>
        <div className="admin-list">
          {templates.map((t) => (
            <div key={t.id}>
              <i style={{ background: t.accent }} />
              <span>
                <b>{t.name}</b>
                <small>{t.category} · Published</small>
              </span>
              <em>Published</em>
              <button onClick={() => notify(`${t.name} settings opened`)}>
                <Settings />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function PageTitle({
  over,
  title,
  text,
}: {
  over: string;
  title: string;
  text: string;
}) {
  return (
    <section className="page-title">
      <span className="eyebrow">{over}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </section>
  );
}

function receiptAmount(
  templateId: string,
  form: Record<string, string>,
  total: string,
): string {
  switch (templateId) {
    case 'mono':
      return `$${form.amount} ${form.monoCurrency}`;
    case 'citrus':
      return `${form.citrusAmount} ${form.citrusAsset}`;
    case 'orbit':
      return form.orbitAmount;
    case 'blue':
      return form.blueFiat;
    case 'indigo':
      return form.indigoAmount;
    case 'black':
      return form.blackAmount;
    case 'dark-blue':
      return form.darkBlueAmount;
    case 'gcash':
      return form.gcashTotal;
    case 'okx':
      return form.okxAmount;
    case 'chase':
      return `${form.chaseAmount} ${form.chaseCurrency}`;
    case 'invoice-aurora':
    case 'invoice-ledger':
    case 'invoice-nova': {
      const invoice = invoiceTotals(form);
      return invoiceMoney(invoice.total, form.invoiceCurrency);
    }
    default:
      return `$${total}`;
  }
}

function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function firebaseErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists for this email address.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email address or password is incorrect.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least six characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait and try again.';
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Firebase blocked this request. Check the Firestore security rules.';
    case 'unavailable':
    case 'firestore/unavailable':
      return 'Firebase is temporarily unavailable. Please try again.';
    default:
      return error instanceof Error
        ? error.message
        : 'Something went wrong while connecting to Firebase.';
  }
}
