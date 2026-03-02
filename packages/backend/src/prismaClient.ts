// Mock Prisma Client for development without database

interface MockData {
  countries: any[];
  feedbackItems: any[];
  teamMembers: any[];
  streams: any[];
  subApps: any[];
  uploads: any[];
  masterData: any[];
  sapImports: any[];
  billingRuns: any[];
  interfacingPlans: any[];
  gdsDcfPartners: any[];
  gdsDcfUploads: any[];
  gdsDcfReservations: any[];
  gdsDcfValidationResults: any[];
}

const mockData: MockData = {
  countries: [
    {
      id: 1,
      fir: 100,
      debitor1: '1000001',
      iso: 'FR',
      kst: 1000,
      name: 'Frankreich',
      comment: 'Test Land',
      verrkto: '123456',
      kreditor: '200001',
      revc: 'EUR',
      partnerStatus: 'aktiv',
      paymentBlock: false,
    },
    {
      id: 2,
      fir: 200,
      debitor1: '1000002',
      iso: 'ES',
      kst: 2000,
      name: 'Spanien',
      comment: 'Test Land 2',
      verrkto: '123457',
      kreditor: '200002',
      revc: 'EUR',
      partnerStatus: 'aktiv',
      paymentBlock: false,
    },
  ],
  feedbackItems: [
    {
      id: 1,
      app: 'Interfacing',
      author: 'Test User',
      type: 'feature',
      title: 'Mock Feature Request',
      description: 'Dies ist ein Test-Feature',
      status: 'open',
      priority: 1,
      automationFTE: 0.5,
      codingEffort: 10,
      peakPercent: 0,
      deadlineWeek: null,
      deadlineDate: null,
      deadlineHistory: null,
      assignee: null,
      notes: null,
      jiraUrl: null,
      confluenceUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      comments: [],
    },
  ],
  teamMembers: [
    { id: 1, name: 'Max Mustermann', role: 'Developer', stream: 'Interfacing', deletePassword: null },
    { id: 2, name: 'Anna Test', role: 'Analyst', stream: 'FSM', deletePassword: null },
  ],
  streams: [
    { id: 1, name: 'Interfacing', sortOrder: 1, streamOwner: 'Max Mustermann', subApps: [] },
    { id: 2, name: 'FSM Calculation', sortOrder: 2, streamOwner: 'Anna Test', subApps: [] },
  ],
  subApps: [
    {
      id: 1,
      streamId: 1,
      app: 'Interfacing',
      owner: 'Max Mustermann',
      status: 'Live & IT Approved',
      description: 'Monthly Interfacing Process',
      deadlineTarget: null,
      budgetHours: 40,
      isStarted: true,
    },
  ],
  uploads: [],
  masterData: [],
  sapImports: [],
  billingRuns: [],
  interfacingPlans: [],
  gdsDcfPartners: [],
  gdsDcfUploads: [],
  gdsDcfReservations: [],
  gdsDcfValidationResults: [],
};

let idCounters = {
  feedbackItems: 2,
  teamMembers: 3,
  streams: 3,
  subApps: 2,
  countries: 3,
  gdsDcfUploads: 1,
  gdsDcfReservations: 1,
  gdsDcfValidationResults: 1,
};

const createMockModel = (modelName: keyof MockData) => {
  return {
    findMany: async (options?: any) => {
      let data = [...mockData[modelName]];
      
      // Basic where filtering
      if (options?.where) {
        data = data.filter((item: any) => {
          for (const [key, value] of Object.entries(options.where)) {
            if (typeof value === 'object' && value !== null) {
              if ('contains' in value) {
                if (!item[key]?.toLowerCase().includes((value as any).contains.toLowerCase())) {
                  return false;
                }
              }
            } else if (item[key] !== value) {
              return false;
            }
          }
          return true;
        });
      }

      // Include relations (simplified)
      if (options?.include?.comments && modelName === 'feedbackItems') {
        data = data.map(item => ({ ...item, comments: item.comments || [] }));
      }

      return data;
    },

    findUnique: async (options: any) => {
      const data = mockData[modelName];
      return data.find((item: any) => item.id === options.where.id) || null;
    },

    findFirst: async (options?: any) => {
      const results = await createMockModel(modelName).findMany(options);
      return results[0] || null;
    },

    create: async (options: any) => {
      const counterKey = modelName as keyof typeof idCounters;
      const newId = idCounters[counterKey] || 1;
      idCounters[counterKey] = newId + 1;

      const newItem = {
        id: newId,
        ...options.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (options.include?.comments) {
        (newItem as any).comments = [];
      }

      mockData[modelName].push(newItem);
      return newItem;
    },

    update: async (options: any) => {
      const data = mockData[modelName];
      const index = data.findIndex((item: any) => item.id === options.where.id);
      
      if (index === -1) {
        throw new Error(`${modelName} with id ${options.where.id} not found`);
      }

      data[index] = {
        ...data[index],
        ...options.data,
        updatedAt: new Date(),
      };

      if (options.include?.comments && modelName === 'feedbackItems') {
        (data[index] as any).comments = (data[index] as any).comments || [];
      }

      return data[index];
    },

    delete: async (options: any) => {
      const data = mockData[modelName];
      const index = data.findIndex((item: any) => item.id === options.where.id);
      
      if (index === -1) {
        throw new Error(`${modelName} with id ${options.where.id} not found`);
      }

      const deleted = data[index];
      data.splice(index, 1);
      return deleted;
    },

    count: async (options?: any) => {
      const results = await createMockModel(modelName).findMany(options);
      return results.length;
    },
  };
};

const mockPrisma = {
  country: createMockModel('countries'),
  feedbackItem: createMockModel('feedbackItems'),
  feedbackComment: {
    create: async (options: any) => {
      const comment = {
        id: Date.now(),
        ...options.data,
        createdAt: new Date(),
      };
      return comment;
    },
  },
  teamMember: createMockModel('teamMembers'),
  stream: createMockModel('streams'),
  subApp: createMockModel('subApps'),
  upload: createMockModel('uploads'),
  masterData: createMockModel('masterData'),
  sapImport: createMockModel('sapImports'),
  billingCostImport: createMockModel('sapImports'),
  depositImport: createMockModel('sapImports'),
  billingRun: createMockModel('billingRuns'),
  interfacingPlan: createMockModel('interfacingPlans'),
  countryPlanAssignment: createMockModel('interfacingPlans'),
  correctedStatement: createMockModel('interfacingPlans'),
  bankGuarantee: createMockModel('masterData'),
  gdsDcfPartner: {
    findMany: async (options?: any) => {
      let data = [...mockData.gdsDcfPartners];
      if (options?.where) {
        data = data.filter((item: any) => {
          for (const [key, value] of Object.entries(options.where)) {
            if (item[key] !== value) return false;
          }
          return true;
        });
      }
      return data;
    },
    findUnique: async (options: any) => {
      return mockData.gdsDcfPartners.find((item: any) => item.id === options.where.id) || null;
    },
    create: async (options: any) => {
      const newItem = {
        ...options.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockData.gdsDcfPartners.push(newItem);
      return newItem;
    },
    update: async (options: any) => {
      const index = mockData.gdsDcfPartners.findIndex((item: any) => item.id === options.where.id);
      if (index === -1) {
        throw new Error(`Partner with id ${options.where.id} not found`);
      }
      mockData.gdsDcfPartners[index] = {
        ...mockData.gdsDcfPartners[index],
        ...options.data,
        updatedAt: new Date(),
      };
      return mockData.gdsDcfPartners[index];
    },
    delete: async (options: any) => {
      const index = mockData.gdsDcfPartners.findIndex((item: any) => item.id === options.where.id);
      if (index === -1) {
        throw new Error(`Partner with id ${options.where.id} not found`);
      }
      const deleted = mockData.gdsDcfPartners[index];
      mockData.gdsDcfPartners.splice(index, 1);
      return deleted;
    },
  },
  gdsDcfUpload: createMockModel('gdsDcfUploads'),
  gdsDcfReservation: {
    ...createMockModel('gdsDcfReservations'),
    createMany: async (options: any) => {
      const items = options.data;
      const created = items.map((item: any) => {
        const newId = idCounters.gdsDcfReservations++;
        const newItem = { id: newId, ...item };
        mockData.gdsDcfReservations.push(newItem);
        return newItem;
      });
      return { count: created.length };
    },
  },
  gdsDcfValidationResult: {
    ...createMockModel('gdsDcfValidationResults'),
    createMany: async (options: any) => {
      const items = options.data;
      const created = items.map((item: any) => {
        const newId = idCounters.gdsDcfValidationResults++;
        const newItem = { id: newId, ...item };
        mockData.gdsDcfValidationResults.push(newItem);
        return newItem;
      });
      return { count: created.length };
    },
  },
  
  $transaction: async (operations: any[]) => {
    return Promise.all(operations);
  },

  $disconnect: async () => {
    console.log('[Mock Prisma] Disconnected');
  },
};

console.log('⚠️  Using MOCK Prisma Client - No real database connection');
console.log('📝 Mock data includes sample countries and feedback items');

export default mockPrisma as any;
