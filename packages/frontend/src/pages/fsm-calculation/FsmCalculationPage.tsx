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

export default function FsmCalculationPage() {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <div>
      <PageTitle>Calculation Rules</PageTitle>
      
      <Card>
        <RulesContainer>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
            This page documents the calculation logic for franchise fees. Expand each section to view detailed rules.
          </p>

          <Section>
            <CollapsibleSection>
              <SectionHeader isOpen={rulesOpen} onClick={() => setRulesOpen(!rulesOpen)}>
                <SectionTitle>
                  GDS & DCF Fee Validation Rules
                </SectionTitle>
                <ExpandIcon isOpen={rulesOpen}>▼</ExpandIcon>
              </SectionHeader>
              <SectionContent isOpen={rulesOpen}>
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
                        Was the booking made through a GDS/DCF partner interface?<br/>
                        <strong>Valid channels:</strong> Configured partner source channels (see Parameter Maintenance)<br/>
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
                  based on partner configuration and region (see Parameter Maintenance for current fee amounts).
                </InfoBox>

                <SubTitle style={{ marginTop: 32 }}>Currency Conversion</SubTitle>
                <p style={{ fontSize: 13, color: '#666' }}>
                  Fees are charged in partner's native currency (EUR or USD). Currency conversion uses 
                  the latest exchange rate available at the time of preparing the statement.
                </p>

                <SubTitle>Payment Flow</SubTitle>
                <ul style={{ lineHeight: 1.8, fontSize: 13, color: '#666' }}>
                  <li><strong>Debtor:</strong> Mandant code pickup branch of the reservation</li>
                  <li><strong>Creditor:</strong> SIXT</li>
                  <li><strong>Point in time:</strong> Handover Date</li>
                </ul>

                <SubTitle>Responsible for Parameter Changes</SubTitle>
                <p style={{ fontSize: 13, color: '#666' }}>
                  Franchise Controlling
                </p>

                <SubTitle>Relevant Stakeholders</SubTitle>
                <p style={{ fontSize: 13, color: '#666' }}>
                  B2P Key Account Management, Business Development, Franchise Accounting & Controlling
                </p>

                <InfoBox type="warning" style={{ marginTop: 24 }}>
                  <strong>Important:</strong> GDS fees for Franchise and Corporate are not connected. 
                  They can be considered independently of each other. Fee only applies where 
                  Franchise & Corporate are connected (source: Thorsten, verbally on 11.02.26).
                </InfoBox>
              </SectionContent>
            </CollapsibleSection>
          </Section>
        </RulesContainer>
      </Card>
    </div>
  );
}
