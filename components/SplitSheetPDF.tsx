import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 40 },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  section: { margin: 10, padding: 10 },
  label: { fontSize: 10, color: '#666666', marginBottom: 2 },
  value: { fontSize: 14, marginBottom: 10 },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: 5, fontSize: 10, padding: 5 },
  disclaimer: { fontSize: 8, color: '#888', marginTop: 30, fontStyle: 'italic', textAlign: 'center' },
  signatureSection: { marginTop: 50, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  signatureBlock: { width: '45%', marginBottom: 40, borderTop: '1px solid #000', paddingTop: 5 },
  signatureText: { fontSize: 10 }
});

// The Component
export const SplitSheetPDF = ({ song, writers }: { song: any, writers: any[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* TITLE */}
      <Text style={styles.header}>Musical Composition Split Sheet</Text>
      <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 30 }}>
        Generated via Paperwork
      </Text>

      {/* SONG INFO */}
      <View style={styles.section}>
        <Text style={styles.label}>Composition Title</Text>
        <Text style={styles.value}>{song.title}</Text>
        
        <Text style={styles.label}>ISWC</Text>
        <Text style={styles.value}>{song.iswc || 'N/A'}</Text>
        
        <Text style={styles.label}>Date Created</Text>
        <Text style={styles.value}>{new Date().toLocaleDateString()}</Text>
      </View>

      {/* SPLIT TABLE */}
      <View style={styles.section}>
        <Text style={{ fontSize: 12, marginBottom: 10, fontWeight: 'bold' }}>Ownership Split Agreement</Text>
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Writer Name</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Email</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Role</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Ownership %</Text></View>
          </View>
          {/* Data Rows */}
          {writers.map((w, i) => (
            <View style={styles.tableRow} key={i}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{w.user?.name || 'Pending User'}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{w.user?.email || w.email}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{w.role}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{w.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* SIGNATURES */}
      <View style={styles.signatureSection}>
        {writers.map((w, i) => (
          <View style={styles.signatureBlock} key={i}>
            <Text style={styles.signatureText}>Signed: ____________________</Text>
            <Text style={{ ...styles.signatureText, fontWeight: 'bold', marginTop: 5 }}>
              {w.user?.name || w.email} ({w.percentage}%)
            </Text>
            <Text style={styles.signatureText}>Date: ____________________</Text>
          </View>
        ))}
      </View>

      {/* FOOTER */}
      <Text style={styles.disclaimer}>
        This document serves as a record of agreed percentages for the composition listed above. 
        It allows any of the listed parties to register their share with their respective PRO.
      </Text>
    </Page>
  </Document>
);