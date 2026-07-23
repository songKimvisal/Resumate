import { Document, Page, View, Text, StyleSheet, pdf } from "@react-pdf/renderer";

export type Receipt = {
  title: string;
  date: string;
  time: string;
  paidVia: string;
  transactionId: string;
  amount: number;
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1a1a1a",
  },
  brand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    color: "#dc2626",
    marginBottom: 24,
  },
  heading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginBottom: 16,
  },
  amount: {
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    color: "#dc2626",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  label: { color: "#666666" },
  value: { fontFamily: "Helvetica-Bold" },
});

function ReceiptDocument({ receipt }: { receipt: Receipt }) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <Text style={styles.brand}>ResuMate</Text>
        <Text style={styles.heading}>Receipt</Text>
        <Text style={styles.amount}>- ${receipt.amount.toFixed(2)}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{receipt.title}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>
            {receipt.date}, {receipt.time}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Paid</Text>
          <Text style={styles.value}>{receipt.paidVia}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Transaction ID</Text>
          <Text style={styles.value}>{receipt.transactionId}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Renders a receipt to PDF and triggers a browser download. */
export async function downloadReceiptPdf(receipt: Receipt) {
  const blob = await pdf(<ReceiptDocument receipt={receipt} />).toBlob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${receipt.transactionId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
