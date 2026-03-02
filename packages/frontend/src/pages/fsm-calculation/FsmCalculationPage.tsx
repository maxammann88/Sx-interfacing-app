import React, { useState } from 'react';
import styled from 'styled-components';
import { PageTitle, Card } from '../../components/ui';

const RulesContainer = styled.div`
  padding: 20px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const CollapsibleSection = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
`;

const SectionHeader = styled.div<{ isOpen: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${props => props.isOpen ? '#f8f9fa' : 'white'};
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: #f8f9fa;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${props => props.theme.colors.text};
`;

const CategoryBadge = styled.span<{ type: 'gds' | 'dcf' }>`
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.type === 'gds' ? '#e3f2fd' : '#fff3e0'};
  color: ${props => props.type === 'gds' ? '#1976d2' : '#f57c00'};
`;

const ExpandIcon = styled.span<{ isOpen: boolean }>`
  font-size: 14px;
  transition: transform 0.2s;
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const SectionContent = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'block' : 'none'};
  padding: 24px;
  background: white;
  border-top: 1px solid #e0e0e0;
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
  const [gdsOpen, setGdsOpen] = useState(false);
  const [dcfOpen, setDcfOpen] = useState(false);

  return (
    <div>
      <PageTitle>Calculation Rules</PageTitle>
      
      <Card>
        <RulesContainer>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
            This page documents the calculation logic for GDS (Global Distribution System) and 
            DCF (Direct Connect Fee) charges. Expand each section to view detailed rules.
          </p>

          <Section>
            <CollapsibleSection>
              <SectionHeader isOpen={gdsOpen} onClick={() => setGdsOpen(!gdsOpen)}>
                <SectionTitle>
                  <CategoryBadge type="gds">GDS</CategoryBadge>
                  Global Distribution System Fees
                </SectionTitle>
                <ExpandIcon isOpen={gdsOpen}>▼</ExpandIcon>
              </SectionHeader>
              <SectionContent isOpen={gdsOpen}>
                {/* GDS Content */}
                <InfoBox type="info">
                  <strong>Future State Implementation:</strong> Fee is charged unless cancelled via the same 
                  partner (not just original booking channel). Fee amount is based on point of sale country.
                </InfoBox>

                <SubTitle>Decision Tree - Fee Validation</SubTitle>
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
                        Was the booking made through a GDS partner interface?<br/>
                        <strong>Valid channels:</strong> Galileo (GG), Worldspan (GW), Sabre (GS), Amadeus (GA)<br/>
                        <strong>If fails:</strong> No fee charged (not a GDS booking)
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
                      <td><strong>Travelport</strong> (Worldspan + Galileo)</td>
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
                      <td><strong>Amadeus - Without eVoucher</strong></td>
                      <td>EUR 5.29</td>
                      <td>EUR 5.29</td>
                      <td>EUR 5.29</td>
                    </tr>
                    <tr>
                      <td><strong>Amadeus - With eVoucher</strong></td>
                      <td>EUR 6.55</td>
                      <td>EUR 6.55</td>
                      <td>EUR 6.55</td>
                    </tr>
                  </tbody>
                </FeeTable>

                <SubTitle>Amadeus Special Rules (eVoucher & DFR)</SubTitle>
                <InfoBox type="info">
                  <strong>eVoucher Detection:</strong><br/>
                  • If Reservation Source Channel 2 or 3 = Amadeus AND Voucher Number is filled → EUR 6.55<br/>
                  • Without eVoucher → EUR 5.29<br/>
                  <br/>
                  <strong>DFR Exceptions:</strong><br/>
                  • Specific DFR codes can override standard fees for both with/without eVoucher variants<br/>
                  • Example: DFR 10355 (Expedia) → EUR 5.29 (for with eVoucher variant)
                </InfoBox>

                <SubTitle>Partner Source Channel Mapping</SubTitle>
                <FeeTable>
                  <thead>
                    <tr>
                      <th>Partner</th>
                      <th>Source Channel Codes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Travelport (Worldspan)</td>
                      <td>GW</td>
                    </tr>
                    <tr>
                      <td>Travelport (Galileo)</td>
                      <td>GG</td>
                    </tr>
                    <tr>
                      <td>Sabre</td>
                      <td>GS</td>
                    </tr>
                    <tr>
                      <td>Amadeus</td>
                      <td>GA</td>
                    </tr>
                  </tbody>
                </FeeTable>
              </SectionContent>
            </CollapsibleSection>
          </Section>

          <Section>
            <CollapsibleSection>
              <SectionHeader isOpen={dcfOpen} onClick={() => setDcfOpen(!dcfOpen)}>
                <SectionTitle>
                  <CategoryBadge type="dcf">DCF</CategoryBadge>
                  Direct Connect Fees
                </SectionTitle>
                <ExpandIcon isOpen={dcfOpen}>▼</ExpandIcon>
              </SectionHeader>
              <SectionContent isOpen={dcfOpen}>
                {/* DCF Content */}
                <InfoBox type="info">
                  <strong>Future State Implementation:</strong> DCF charges apply to direct API connections 
                  with online travel agencies (OTAs). Same validation rules as GDS apply.
                </InfoBox>

                <SubTitle>Decision Tree - Fee Validation</SubTitle>
                <p>Same 6-step validation as GDS, adjusted for DCF partners:</p>
                
                <DecisionTree>
                  <DecisionStep>
                    <StepNumber>2</StepNumber>
                    <StepContent>
                      <StepTitle>Booking Channel / Interface Check</StepTitle>
                      <StepDescription>
                        Was the booking made through a DCF partner interface?<br/>
                        <strong>Valid channels:</strong> SOAP, TPRA (API connections)<br/>
                        <strong>Partners:</strong> Expedia, Priceline, Meili<br/>
                        <strong>If fails:</strong> No fee charged (not a DCF booking)
                      </StepDescription>
                    </StepContent>
                  </DecisionStep>
                </DecisionTree>
                <p style={{ fontSize: 13, color: '#666', fontStyle: 'italic' }}>
                  Steps 1, 3, 4, 5, and 6 are identical to GDS validation.
                </p>

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
                      <td><strong>Expedia</strong></td>
                      <td>EUR 3.00</td>
                      <td>EUR 4.00</td>
                      <td>EUR 4.00</td>
                    </tr>
                    <tr>
                      <td><strong>Priceline</strong></td>
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

                <SubTitle>Meili Special Rules (DFR-based Discount)</SubTitle>
                <InfoBox type="info">
                  <strong>DFR Detection:</strong><br/>
                  • DFR = 10897 (Autoclub Australia) → EUR 2.75<br/>
                  • Other DFR codes → EUR 5.50 (standard fee)
                </InfoBox>
                
                <Formula>
                  Meili base fee = EUR 5.50<br/>
                  Meili with DFR 10897 = EUR 2.75
                </Formula>

                <SubTitle>Partner Source Channel Mapping</SubTitle>
                <FeeTable>
                  <thead>
                    <tr>
                      <th>Partner</th>
                      <th>Source Channel Codes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Expedia</td>
                      <td>Expedia02I6, SOAP, TPRA (varies by source)</td>
                    </tr>
                    <tr>
                      <td>Priceline</td>
                      <td>PriceLine011S</td>
                    </tr>
                    <tr>
                      <td>Meili</td>
                      <td>Meili</td>
                    </tr>
                  </tbody>
                </FeeTable>
              </SectionContent>
            </CollapsibleSection>
          </Section>

          <Section style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e0e0e0' }}>
            <SubTitle>General Information</SubTitle>
            
            <InfoBox type="warning">
              <strong>Important:</strong> GDS fees for Franchise and Corporate are not connected. 
              They can be considered independently of each other. Fee only applies where 
              Franchise & Corporate are connected (source: Thorsten, verbally on 11.02.26).
            </InfoBox>

            <div style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 14 }}>Currency Conversion</strong>
              <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                Fees are charged in partner's native currency (EUR or USD). Currency conversion uses 
                the latest exchange rate available at the time of preparing the statement.
              </p>
            </div>

            <div style={{ marginTop: 16 }}>
              <strong style={{ fontSize: 14 }}>Payment Flow</strong>
              <ul style={{ lineHeight: 1.8, fontSize: 13, color: '#666', marginTop: 8 }}>
                <li><strong>Debtor:</strong> Mandant code pickup branch of the reservation</li>
                <li><strong>Creditor:</strong> SIXT</li>
                <li><strong>Point in time:</strong> Handover Date</li>
              </ul>
            </div>
            
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
