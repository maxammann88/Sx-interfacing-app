import React from 'react';
import styled from 'styled-components';
import { PageTitle, Card } from '../../components/ui';

const RulesContainer = styled.div`
  padding: 20px;
`;

const Section = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.theme.colors.text};
  border-bottom: 2px solid ${props => props.theme.colors.primary};
  padding-bottom: 8px;
`;

const SubTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 12px 0;
  color: ${props => props.theme.colors.textSecondary};
`;

const DecisionTree = styled.div`
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
`;

const DecisionStep = styled.div<{ passed?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 12px 0;
  padding: 12px;
  background: white;
  border-left: 4px solid ${props => props.passed === false ? '#ff4444' : '#4CAF50'};
  border-radius: 4px;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
`;

const StepNumber = styled.div<{ passed?: boolean }>`
  min-width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${props => props.passed === false ? '#ff4444' : '#4CAF50'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: ${props => props.theme.colors.text};
`;

const StepDescription = styled.div`
  font-size: 13px;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.5;
`;

const FeeTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 13px;
  
  th, td {
    padding: 10px 12px;
    text-align: left;
    border: 1px solid #e0e0e0;
  }
  
  th {
    background: #f5f5f5;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
  }
  
  tbody tr:hover {
    background: #f9f9f9;
  }
`;

const InfoBox = styled.div<{ type?: 'info' | 'warning' | 'success' }>`
  padding: 12px 16px;
  border-radius: 6px;
  margin: 16px 0;
  background: ${props => {
    if (props.type === 'warning') return '#fff3cd';
    if (props.type === 'success') return '#d4edda';
    return '#d1ecf1';
  }};
  border-left: 4px solid ${props => {
    if (props.type === 'warning') return '#ffc107';
    if (props.type === 'success') return '#28a745';
    return '#17a2b8';
  }};
  font-size: 13px;
  line-height: 1.6;
`;

const Formula = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px 16px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin: 12px 0;
  color: #495057;
`;

export default function FsmCalculationPage() {
  return (
    <div>
      <PageTitle>Calculation Rules - GDS & DCF Fees</PageTitle>
      
      <Card>
        <RulesContainer>
          <Section>
            <SectionTitle>Overview</SectionTitle>
            <p>
              This page documents the calculation logic for GDS (Global Distribution System) and 
              DCF (Direct Connect Fee) charges. The system automatically identifies chargeable 
              reservations and calculates applicable fees based on partner, region, and booking conditions.
            </p>
            
            <InfoBox type="info">
              <strong>Future State Implementation:</strong> Fee is charged unless cancelled via the same 
              partner (not just original booking channel). Fee amount is based on point of sale country, 
              providing flexibility for country-level adjustments.
            </InfoBox>
          </Section>

          <Section>
            <SectionTitle>Decision Tree - Fee Validation</SectionTitle>
            <p>Every reservation must pass all 6 validation steps to be charged a fee:</p>
            
            <DecisionTree>
              <DecisionStep>
                <StepNumber>1</StepNumber>
                <StepContent>
                  <StepTitle>Reservation Number Check</StepTitle>
                  <StepDescription>
                    Has a reservation been made?<br/>
                    <strong>Condition:</strong> ResNr &gt; 0<br/>
                    <strong>If fails:</strong> No fee charged
                  </StepDescription>
                </StepContent>
              </DecisionStep>

              <DecisionStep>
                <StepNumber>2</StepNumber>
                <StepContent>
                  <StepTitle>Booking Channel / Interface Check</StepTitle>
                  <StepDescription>
                    Was the booking made through a GDS/DCF partner interface?<br/>
                    <strong>Valid channels:</strong> SOAP, TPRA (DCF) | Galileo (GG), Worldscan (GW), 
                    Sabre (GS), Amadeus (GA), Expedia, Priceline, Meili<br/>
                    <strong>If fails:</strong> No fee charged (not a GDS/DCF booking)
                  </StepDescription>
                </StepContent>
              </DecisionStep>

              <DecisionStep>
                <StepNumber>3</StepNumber>
                <StepContent>
                  <StepTitle>Partner Check</StepTitle>
                  <StepDescription>
                    Is the identified partner configured in the system?<br/>
                    <strong>Condition:</strong> Partner exists in parameter configuration<br/>
                    <strong>If fails:</strong> No fee charged
                  </StepDescription>
                </StepContent>
              </DecisionStep>

              <DecisionStep>
                <StepNumber>4</StepNumber>
                <StepContent>
                  <StepTitle>Mandant Code Pick-Up Branch Check</StepTitle>
                  <StepDescription>
                    Was the reservation made for a franchise branch?<br/>
                    <strong>Condition:</strong> Mandant code is assigned to franchisee<br/>
                    <strong>If fails:</strong> No fee charged (not a franchise booking)
                  </StepDescription>
                </StepContent>
              </DecisionStep>

              <DecisionStep>
                <StepNumber>5</StepNumber>
                <StepContent>
                  <StepTitle>Reservation Status Check</StepTitle>
                  <StepDescription>
                    What is the booking status?<br/>
                    <strong>Valid statuses:</strong> Invoice, No Show, Open, 
                    Cancellation not via original booking channel<br/>
                    <strong>If fails:</strong> No fee charged (cancelled via same channel)
                  </StepDescription>
                </StepContent>
              </DecisionStep>

              <DecisionStep>
                <StepNumber>6</StepNumber>
                <StepContent>
                  <StepTitle>Invoice Type and Serial Number Check</StepTitle>
                  <StepDescription>
                    Is this the main invoice and first in series?<br/>
                    <strong>Condition:</strong> Main Invoice AND MSER = 0<br/>
                    <strong>If fails:</strong> No fee charged (prevents duplicate charging)
                  </StepDescription>
                </StepContent>
              </DecisionStep>
            </DecisionTree>

            <InfoBox type="success">
              <strong>All steps passed?</strong> The system proceeds to calculate the fee amount 
              based on partner and region.
            </InfoBox>
          </Section>

          <Section>
            <SectionTitle>Fee Amount Calculation</SectionTitle>
            
            <SubTitle>Standard Fee by Partner and Region</SubTitle>
            <FeeTable>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>EMEA</th>
                  <th>Americas</th>
                  <th>Other</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Travelport</strong> (Worldscan + Galileo)</td>
                  <td>USD 8.60</td>
                  <td>USD 8.60</td>
                  <td>USD 8.60</td>
                </tr>
                <tr>
                  <td><strong>Sabre</strong></td>
                  <td>USD 7.17</td>
                  <td>USD 7.17</td>
                  <td>USD 7.17</td>
                </tr>
                <tr>
                  <td><strong>Amadeus</strong></td>
                  <td>EUR 5.29</td>
                  <td>EUR 5.29</td>
                  <td>EUR 5.29</td>
                </tr>
                <tr>
                  <td><strong>Expedia</strong> (EMEA source)</td>
                  <td>EUR 3.00</td>
                  <td>EUR 4.00</td>
                  <td>EUR 4.00</td>
                </tr>
                <tr>
                  <td><strong>Priceline</strong> (The Americas)</td>
                  <td>USD 3.25</td>
                  <td>USD 3.25</td>
                  <td>USD 1.50</td>
                </tr>
                <tr>
                  <td><strong>Meili</strong></td>
                  <td>EUR 5.50</td>
                  <td>EUR 5.50</td>
                  <td>EUR 5.50</td>
                </tr>
              </tbody>
            </FeeTable>

            <SubTitle>Amadeus Special Rules (eVoucher)</SubTitle>
            <InfoBox type="info">
              <strong>Voucher Number Detection:</strong><br/>
              • If Reservation Source Channel 2 or 3 = Amadeus AND Voucher Number is filled → EUR 6.55<br/>
              • Exception: If Reservation Source Channel 3 = Amadeus AND Channel 2 = TPRA AND DFR = 10355 (Expedia) → EUR 5.29
            </InfoBox>
            
            <Formula>
              Amadeus base fee = EUR 5.29<br/>
              Amadeus with eVoucher = EUR 5.29 + EUR 0.26 = EUR 6.55<br/>
              Amadeus via TPRA with DFR 10355 = EUR 5.29 (no adjustment)
            </Formula>

            <SubTitle>Meili Special Rules (DFR-based Discount)</SubTitle>
            <InfoBox type="info">
              <strong>DFR Detection:</strong><br/>
              • DFR = 10897 (Autoclub Australia) → EUR 2.75<br/>
              • Other DFR codes → EUR 5.50
            </InfoBox>
            
            <Formula>
              Meili base fee = EUR 5.50<br/>
              Meili with DFR 10897 = EUR 5.50 - EUR 2.75 = EUR 2.75
            </Formula>
          </Section>

          <Section>
            <SectionTitle>Currency Conversion</SectionTitle>
            <p>
              Fees are charged in partner's native currency (EUR or USD). Currency conversion uses 
              the latest exchange rate available at the time of preparing the statement.
            </p>
          </Section>

          <Section>
            <SectionTitle>Payment Flow</SectionTitle>
            <ul style={{ lineHeight: 1.8 }}>
              <li><strong>Debtor:</strong> Mandant code pickup branch of the reservation</li>
              <li><strong>Creditor:</strong> SIXT</li>
              <li><strong>Point in time:</strong> Handover Date</li>
            </ul>
          </Section>

          <Section>
            <SectionTitle>Example Scenarios</SectionTitle>
            
            <SubTitle>Scenario 1: Chargeable Reservation</SubTitle>
            <DecisionTree>
              <div style={{ marginBottom: 12 }}>
                <strong>Reservation Details:</strong><br/>
                ResNr: 9728819374 | Source: GDS_SABRE | POS: FR | Mandant: 08234 | Status: Invoice | Invoice Type: Main, MSER=0
              </div>
              <DecisionStep>
                <StepNumber>✓</StepNumber>
                <StepContent>
                  <StepTitle>Result: Fee Charged</StepTitle>
                  <StepDescription>
                    Partner: Sabre | Region: EMEA | Fee: USD 7.17
                  </StepDescription>
                </StepContent>
              </DecisionStep>
            </DecisionTree>

            <SubTitle>Scenario 2: Not Chargeable (Cancelled via Original Channel)</SubTitle>
            <DecisionTree>
              <div style={{ marginBottom: 12 }}>
                <strong>Reservation Details:</strong><br/>
                ResNr: 9728888864 | Source: XML_INTERFACE | Status: Cancelled via original booking channel
              </div>
              <DecisionStep passed={false}>
                <StepNumber>✗</StepNumber>
                <StepContent>
                  <StepTitle>Result: No Fee</StepTitle>
                  <StepDescription>
                    Reason: Cancelled via original booking channel (Step 5 failed)
                  </StepDescription>
                </StepContent>
              </DecisionStep>
            </DecisionTree>

            <SubTitle>Scenario 3: Amadeus with eVoucher</SubTitle>
            <DecisionTree>
              <div style={{ marginBottom: 12 }}>
                <strong>Reservation Details:</strong><br/>
                ResNr: 9728413837 | Source: GDS_GALILEO | Channel 2: Amadeus | Voucher: filled | DFR: other than 10355
              </div>
              <DecisionStep>
                <StepNumber>✓</StepNumber>
                <StepContent>
                  <StepTitle>Result: Fee Charged</StepTitle>
                  <StepDescription>
                    Partner: Amadeus | Region: EMEA | Base Fee: EUR 5.29 + eVoucher adjustment EUR 0.26 = <strong>EUR 6.55</strong>
                  </StepDescription>
                </StepContent>
              </DecisionStep>
            </DecisionTree>
          </Section>

          <Section>
            <SectionTitle>Partner Source Channel Mapping</SectionTitle>
            <FeeTable>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Source Channel Codes</th>
                  <th>Technology</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Travelport (Worldscan)</td>
                  <td>GW</td>
                  <td>GDS</td>
                </tr>
                <tr>
                  <td>Travelport (Galileo)</td>
                  <td>GG</td>
                  <td>GDS</td>
                </tr>
                <tr>
                  <td>Sabre</td>
                  <td>GS</td>
                  <td>GDS</td>
                </tr>
                <tr>
                  <td>Amadeus</td>
                  <td>GA</td>
                  <td>GDS</td>
                </tr>
                <tr>
                  <td>Expedia</td>
                  <td>SOAP, TPRA (varies by source)</td>
                  <td>API/DCF</td>
                </tr>
                <tr>
                  <td>Priceline</td>
                  <td>PriceLine011S</td>
                  <td>API/DCF</td>
                </tr>
                <tr>
                  <td>Meili</td>
                  <td>Meili</td>
                  <td>API/DCF</td>
                </tr>
              </tbody>
            </FeeTable>
          </Section>

          <Section>
            <SectionTitle>Additional Notes</SectionTitle>
            <InfoBox type="warning">
              <strong>Important:</strong> GDS fees for Franchise and Corporate are not connected. 
              They can be considered independently of each other. Fee only applies where 
              Franchise & Corporate are connected (source: Thorsten, verbally on 11.02.26).
            </InfoBox>
            
            <p style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
              <strong>Responsible for parameter changes:</strong> Franchise Controlling<br/>
              <strong>Stakeholders:</strong> B2P Key Account Management, Business Development, Franchise Accounting & Controlling
            </p>
          </Section>
        </RulesContainer>
      </Card>
    </div>
  );
}
