# GDS & DCF Demo Reservierungen

Diese Datei enthält Beispiel-Reservierungen, um den kompletten Flow zu demonstrieren: Upload → Validierung → Gebührenberechnung → Ergebnisanzeige.

## Verwendung

1. Starten Sie Backend und Frontend: `pnpm dev`
2. Navigieren Sie zur "Data Upload" Seite
3. Laden Sie `GDS_DCF_Sample_Reservations.csv` hoch
4. Das System validiert und berechnet automatisch die Gebühren
5. Klicken Sie auf "View Results" um die detaillierten Ergebnisse zu sehen

## Enthaltene Reservierungen

| RES-NUMBER | SOURCE | POS | Partner | Typ | Erwartete Gebühr |
|------------|--------|-----|---------|-----|------------------|
| RES001 | GW | DE | Travelport (Worldspan) | GDS | 8.60 USD |
| RES002 | GS | US | Sabre | GDS | 7.17 USD |
| RES003 | GA | FR | Amadeus | GDS | 6.55 EUR |
| RES004 | SOAP_Expedia | DE | Expedia | DCF | 3.00 EUR |
| RES005 | TPRA-Priceline | US | Priceline | DCF | 3.25 USD |
| RES006 | SOAP-Meili | GB | Meili | DCF | 5.50 EUR |
| RES007 | GG | JP | Travelport (Galileo) | GDS | 8.60 USD |
| RES008 | TPRA_Expedia | BR | Expedia | DCF | 4.00 EUR |

## Erwartetes Ergebnis

- **Total Reservations:** 8
- **Chargeable:** 8
- **Total Fees:** ~48.67 (gemischt EUR/USD)

Alle Reservierungen sollten die 6 Validierungsschritte erfolgreich durchlaufen:
1. ✓ Reservation Number Check
2. ✓ Interface/Booking Channel Check
3. ✓ Partner Check
4. ✓ Franchise Mandant Check (lenient mode)
5. ✓ Reservation Status Check
6. ✓ Invoice Type and Serial Number Check

## Regionen-Zuordnung

- **EMEA:** DE, FR, GB → Euro-Gebühren für DCF-Partner
- **Americas:** US, BR → USD/höhere Gebühren für einige Partner
- **Other:** JP → Standard-Gebühren

## GDS Partners

1. **Travelport (Worldspan + Galileo):** SOURCE = "GW" oder "GG" → 8.60 USD
2. **Sabre:** SOURCE = "GS" → 7.17 USD
3. **Amadeus:** SOURCE = "GA" → 6.55 EUR

## DCF Partners

1. **Expedia:** SOURCE enthält "Expedia" → 3.00 EUR (EMEA), 4.00 EUR (Americas)
2. **Priceline:** SOURCE enthält "Priceline" → 3.25 USD (EMEA/Americas)
3. **Meili:** SOURCE enthält "Meili" → 5.50 EUR (alle Regionen)

## Hinweise für morgen

Wenn die echten Daten vorliegen:
- Spaltenüberschriften ggf. anpassen in `packages/backend/src/services/gdsDcfParser.ts`
- SOURCE-Format anpassen (aktuell: muss Partner-Name enthalten für DCF)
- Weitere Partner bei Bedarf hinzufügen in `packages/backend/src/services/gdsDcfValidator.ts`
