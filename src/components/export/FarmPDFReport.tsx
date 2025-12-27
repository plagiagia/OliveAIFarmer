'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import {
  type FarmReportData,
  activityTypeLabels,
  healthLabels,
  statusLabels,
  formatDate,
  formatCurrency,
  formatNumber
} from '@/lib/export/pdf'

// Register a font that supports Greek characters
// Using Roboto which has good Greek support
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2E7D32',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    color: '#666666',
  },
  value: {
    width: '60%',
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    padding: 8,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableRowAlt: {
    backgroundColor: '#F9F9F9',
  },
  tableCell: {
    flex: 1,
  },
  tableCellSmall: {
    flex: 0.5,
  },
  summaryBox: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    color: '#2E7D32',
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999999',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
  },
})

interface FarmPDFReportProps {
  data: FarmReportData
}

export function FarmPDFReport({ data }: FarmPDFReportProps) {
  const { farm, trees, activities, harvests, summary } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{farm.name}</Text>
          <Text style={styles.subtitle}>Αναφορά Ελαιώνα - ΕλαιοLog</Text>
        </View>

        {/* Farm Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Στοιχεία Ελαιώνα</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Τοποθεσία:</Text>
            <Text style={styles.value}>{farm.location}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Έκταση:</Text>
            <Text style={styles.value}>{farm.totalArea ? `${farm.totalArea} στρέμματα` : '-'}</Text>
          </View>
          {farm.coordinates && (
            <View style={styles.row}>
              <Text style={styles.label}>Συντεταγμένες:</Text>
              <Text style={styles.value}>{farm.coordinates}</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Συνολικά Δέντρα:</Text>
            <Text style={styles.summaryValue}>{summary.totalTrees}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Δραστηριότητες:</Text>
            <Text style={styles.summaryValue}>{summary.totalActivities}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Συγκομιδές:</Text>
            <Text style={styles.summaryValue}>{summary.totalHarvests}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Συνολική Παραγωγή:</Text>
            <Text style={styles.summaryValue}>{formatNumber(summary.totalYield)} kg</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Συνολική Αξία:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalValue)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Συνολικό Κόστος:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalCost)}</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Δημιουργήθηκε στις {new Date().toLocaleDateString('el-GR')} από το ΕλαιοLog
        </Text>
      </Page>

      {/* Trees Page */}
      {trees.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Δέντρα ({trees.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellSmall}>Αρ.</Text>
                <Text style={styles.tableCell}>Ποικιλία</Text>
                <Text style={styles.tableCell}>Υγεία</Text>
                <Text style={styles.tableCell}>Κατάσταση</Text>
              </View>
              {trees.slice(0, 30).map((tree, index) => (
                <View
                  key={index}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <Text style={styles.tableCellSmall}>{tree.treeNumber}</Text>
                  <Text style={styles.tableCell}>{tree.variety}</Text>
                  <Text style={styles.tableCell}>{healthLabels[tree.health] || tree.health}</Text>
                  <Text style={styles.tableCell}>{statusLabels[tree.status] || tree.status}</Text>
                </View>
              ))}
              {trees.length > 30 && (
                <View style={styles.tableRow}>
                  <Text>... και {trees.length - 30} ακόμη δέντρα</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.footer}>
            Δημιουργήθηκε στις {new Date().toLocaleDateString('el-GR')} από το ΕλαιοLog
          </Text>
        </Page>
      )}

      {/* Activities Page */}
      {activities.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Δραστηριότητες ({activities.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCell}>Τύπος</Text>
                <Text style={styles.tableCell}>Τίτλος</Text>
                <Text style={styles.tableCellSmall}>Ημ/νία</Text>
                <Text style={styles.tableCellSmall}>Κόστος</Text>
              </View>
              {activities.slice(0, 25).map((activity, index) => (
                <View
                  key={index}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <Text style={styles.tableCell}>{activityTypeLabels[activity.type] || activity.type}</Text>
                  <Text style={styles.tableCell}>{activity.title}</Text>
                  <Text style={styles.tableCellSmall}>{formatDate(activity.date)}</Text>
                  <Text style={styles.tableCellSmall}>{activity.cost ? formatCurrency(activity.cost) : '-'}</Text>
                </View>
              ))}
              {activities.length > 25 && (
                <View style={styles.tableRow}>
                  <Text>... και {activities.length - 25} ακόμη δραστηριότητες</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.footer}>
            Δημιουργήθηκε στις {new Date().toLocaleDateString('el-GR')} από το ΕλαιοLog
          </Text>
        </Page>
      )}

      {/* Harvests Page */}
      {harvests.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Συγκομιδές ({harvests.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCellSmall}>Έτος</Text>
                <Text style={styles.tableCell}>Παραγωγή (kg)</Text>
                <Text style={styles.tableCell}>Τιμή/kg</Text>
                <Text style={styles.tableCell}>Συνολική Αξία</Text>
              </View>
              {harvests.map((harvest, index) => (
                <View
                  key={index}
                  style={index % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}
                >
                  <Text style={styles.tableCellSmall}>{harvest.year}</Text>
                  <Text style={styles.tableCell}>{formatNumber(harvest.totalYield)}</Text>
                  <Text style={styles.tableCell}>{harvest.pricePerKg ? formatCurrency(harvest.pricePerKg) : '-'}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(harvest.totalValue)}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.footer}>
            Δημιουργήθηκε στις {new Date().toLocaleDateString('el-GR')} από το ΕλαιοLog
          </Text>
        </Page>
      )}
    </Document>
  )
}
