/* =========================================================
   SAMPLE / SEED DATA
   Used only the very first time the app runs (empty localStorage)
   ========================================================= */

const TRANSPORT_MODES = ["Bus", "Train", "Common Transport", "Courier", "Company Vehicle", "Other"];

const SEED_DRIVERS = [
  { id: "drv_1", name: "SURAJ", type: "Company Vehicle", phone: "", status: "Active" },
  { id: "drv_2", name: "RAMESH", type: "Transport Driver", phone: "", status: "Active" },
];

const SEED_TRANSPORTERS = [
  { id: "trn_1", name: "MAA ROHANI TRAVELS", mode: "Bus", contact: "", status: "Active" },
  { id: "trn_2", name: "DIVEDI BUS", mode: "Bus", contact: "", status: "Active" },
  { id: "trn_3", name: "SHIVNATH TRAVELS", mode: "Bus", contact: "", status: "Active" },
  { id: "trn_4", name: "PAYAL TRAVELS", mode: "Bus", contact: "", status: "Active" },
  { id: "trn_5", name: "MAHENDRA BOX", mode: "Courier", contact: "", status: "Active" },
  { id: "trn_6", name: "PANKAJ SAMIR TRANS.", mode: "Common Transport", contact: "", status: "Active" },
];

const SEED_AREAS = [
  { id: "area_1", name: "MANDLA", status: "Active" },
  { id: "area_2", name: "JABALPUR", status: "Active" },
  { id: "area_3", name: "MIRJAPUR", status: "Active" },
  { id: "area_4", name: "JASHPUR", status: "Active" },
  { id: "area_5", name: "SIVNI", status: "Active" },
  { id: "area_6", name: "AMRAWATI", status: "Active" },
  { id: "area_7", name: "BHATAPARA", status: "Active" },
];

/* Dispatch record fields:
   id, srlNo, dateBooking, dateEntry, party, area, invNo, bundles,
   transport, bultyNo, amount, voucherSrlNo, voucherNo,
   driver, exportStatus ("Not Exported" | "Exported"), exportNo (null until exported)
*/
const SEED_DISPATCH_RECORDS = [
  { srlNo: 1, dateBooking: "2026-08-08", dateEntry: "2026-08-10", party: "MAIKAL VALLEY", area: "MANDLA", invNo: "CB5620, CB5649", bundles: 1, transport: "MAA ROHANI TRAVELS", bultyNo: "4", amount: 150, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
  { srlNo: 2, dateBooking: "2026-08-08", dateEntry: "2026-08-10", party: "KAVYA BOOK DEPO", area: "JABALPUR", invNo: "IN661", bundles: 8, transport: "MAA ROHANI TRAVELS", bultyNo: "5", amount: 1200, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
  { srlNo: 3, dateBooking: "2026-08-08", dateEntry: "2026-08-10", party: "PRANAV BHARGAW", area: "JABALPUR", invNo: "CB5644, CB5616", bundles: 1, transport: "MAA ROHANI TRAVELS", bultyNo: "6", amount: 150, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
  { srlNo: 4, dateBooking: "2026-08-08", dateEntry: "2026-08-10", party: "BUDHE BABA DADA JI", area: "JABALPUR", invNo: "CB5637", bundles: 1, transport: "MAA ROHANI TRAVELS", bultyNo: "7", amount: 150, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
  { srlNo: 5, dateBooking: "2026-08-08", dateEntry: "2026-08-10", party: "PARNAV BHARGAW", area: "JABALPUR", invNo: "CB5666, CB5693, IN657, MI217", bundles: 1, transport: "MAA ROHANI TRAVELS", bultyNo: "8", amount: 150, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
  { srlNo: 6, dateBooking: "2026-08-08", dateEntry: "2026-08-10", party: "PM SHREE GOVT. H.S.S", area: "MANDLA", invNo: "IN664", bundles: 1, transport: "MAA ROHANI TRAVELS", bultyNo: "1", amount: 150, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
  { srlNo: 7, dateBooking: "2026-08-08", dateEntry: "2026-08-10", party: "GOVT.GIRLS H.S.S", area: "MANDLA", invNo: "IN670", bundles: 1, transport: "MAA ROHANI TRAVELS", bultyNo: "2", amount: 150, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
  { srlNo: 8, dateBooking: "2026-08-08", dateEntry: "2026-08-10", party: "GOVT. EXCELLENT H.S.S.", area: "MANDLA", invNo: "IN666", bundles: 1, transport: "MAA ROHANI TRAVELS", bultyNo: "3", amount: 150, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
  { srlNo: 9, dateBooking: "2026-08-09", dateEntry: "2026-08-11", party: "CHANDA BAL CONVENT", area: "MIRJAPUR", invNo: "CB5645", bundles: 1, transport: "DIVEDI BUS", bultyNo: "", amount: 500, voucherSrlNo: "", voucherNo: "", driver: "RAMESH" },
  { srlNo: 10, dateBooking: "2026-08-09", dateEntry: "2026-08-11", party: "SHARN SHRAY M.SCHOOL", area: "JASHPUR", invNo: "CB5671", bundles: 1, transport: "SHIVNATH TRAVELS", bultyNo: "92", amount: 250, voucherSrlNo: "", voucherNo: "", driver: "RAMESH" },
  { srlNo: 11, dateBooking: "2026-08-09", dateEntry: "2026-08-11", party: "GOVT. P.M. SHREE", area: "SIVNI", invNo: "IN655", bundles: 2, transport: "PAYAL TRAVELS", bultyNo: "1930", amount: 500, voucherSrlNo: "", voucherNo: "", driver: "RAMESH" },
  { srlNo: 12, dateBooking: "2026-08-09", dateEntry: "2026-08-11", party: "B.K.S.PLAY SCHOOL", area: "AMRAWATI", invNo: "CB5632", bundles: 1, transport: "MAHENDRA BOX", bultyNo: "40454", amount: 250, voucherSrlNo: "", voucherNo: "", driver: "RAMESH" },
  { srlNo: 13, dateBooking: "2026-08-09", dateEntry: "2026-08-11", party: "CHINMAY SAGAR VIDHA", area: "BHATAPARA", invNo: "CB5664", bundles: 1, transport: "PANKAJ SAMIR TRANS.", bultyNo: "7344", amount: 50, voucherSrlNo: "", voucherNo: "", driver: "SURAJ" },
];

const DEFAULT_SETTINGS = {
  companyName: "",
  startExportNo: 577,
  startVoNo: 587,
  exportLimit: 10000,
  defaultDriver: "",
  defaultMode: "Bus",
};