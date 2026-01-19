import { Deal, DealStatus, EventType, FinancialEntry, TransactionType, User, UserRole, UserStatus } from "../types";

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alexandre Silva',
    email: 'admin@buffet.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvtVUVqVid9aoyT6XL44qBNJdv9qtv7I5YKxDppMv8Hndg1Bg7Imlv_UUNmtC8pcsHCvR4hg2AE4tVOgnZuFekLtzC5qaBVtsms2rIRO2UiP1cmx3FNRA225CueP8ht0mWnAvlxQoecP6Ip2tj3QGNLLpKBzIASuj7LWB-GbLj1LF7TEQdmcB5qbdzzSYXyI8kNlTUyoyIwLKGkcNLx-sHYHephjUdhNo7Kfb9Lqit76wpkewzT5p4P1AXpAQsqSf4xInwcMP1kOFU',
    password: 'password'
  },
  {
    id: 'u2',
    name: 'João Souza',
    email: 'john@buffet.com',
    role: UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDp-zAaynPXMiCKPMf97TNzNLoQtS8X2IUPAF5AA6RN6Vts2QZyMKcROTfBIVrQpvkTVLV2YVjOZjui2LgNVthpAVe8ObSF9n-E4hRpW5yG_D52dy2ywVRlHflUylnjJ8wKBx-15Kk1ScNhHLFTeXk0AmZJDxlyCoMga3aikXOvIBz_srZjYM4z-bZHBm3FJfzX7Ms3Q4uhQUKncg2LjQyfLuNVa1e8aWfXTxvrIoVxV93RUIaCqxoBxl8VYmOasiBUWyBW7pMDUdwU',
    rating: 4.8,
    password: 'password'
  },
  {
    id: 'u3',
    name: 'Maria Oliveira',
    email: 'jane@buffet.com',
    role: UserRole.EMPLOYEE,
    status: UserStatus.ACTIVE,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdsxLphzWZ_VPHigLEJx4m4-P03wZ0DQr46DlMpG4P_hgGRmbZ2TGwyvZIIicdHq4W0Xcqlr_CMLdIvrPOMIJHXW3SNonz5lUeLvAJl8mRCnXO8XhFE0cGqzX4J2Ms9kGY5RlOEPj3DuNjbw7V6JpxA791G0q8aUl5SjByYNQisu3iC6GOay2wo8LBFTiI11muN_2hP5iw0awsOiqaGsBUPNH3xepR-YNhtTvaUEurfNUK1jeV_GMRXEMz6g1tMrK4crEww8Mjqq59',
    rating: 4.9,
    password: 'password'
  },
  {
    id: 'u4',
    name: 'Roberto Ferreira',
    email: 'robert@buffet.com',
    role: UserRole.EMPLOYEE,
    status: UserStatus.INACTIVE,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEihlxug2P7QotzLAi4TnjP0832oowAsBSoj6f-R7Z79JxVGOIfcay7LiBkfsCUQlLdxJnV-I2ca2VDFd-aHl7G_TsZ-7x8WMw9m0xpk0mU9KVmLKlf3ktPo4yaciVMCkepWT1T-wHFjVwj6AsfOjECurdWN_HIrruuApFFI99sdr-WSLAYIZ51ZAw-hYp1eYdyrd1qShUpJSBw6dZRi_M2UZNoc0u4yEAZiFOI9QMeFHQYK5RdPGAhnDqE3EGtrZyt8S26zTzABTt',
    password: 'password'
  }
];

export const MOCK_DEALS: Deal[] = [
  {
    id: 'd1',
    clientName: 'TechCorp Soluções',
    clientEmail: 'contato@techcorp.com',
    eventName: 'Gala TechCorp Q4',
    eventDate: '2026-12-15',
    startTime: '18:00',
    endTime: '23:00',
    eventType: EventType.CORPORATE,
    guestCount: 450,
    status: DealStatus.LEAD,
    value: 15000,
    requirements: [{ role: 'Garçom', count: 10 }, { role: 'Barman', count: 4 }],
    assignments: [],
    createdAt: '2026-10-01'
  },
  {
    id: 'd2',
    clientName: 'Sarah Andrade',
    clientEmail: 'sarah.j@exemplo.com',
    clientPhone: '+55 (11) 99999-1234',
    eventName: "Casamento Sarah Andrade",
    eventDate: '2026-10-24',
    startTime: '14:00',
    endTime: '22:00',
    eventType: EventType.WEDDING,
    guestCount: 150,
    status: DealStatus.NEGOTIATION,
    value: 12450,
    requirements: [{ role: 'Garçom', count: 8 }, { role: 'Chef', count: 2 }],
    assignments: [
      { userId: 'u2', role: 'Garçom', status: 'APPROVED', appliedAt: '2026-10-12' },
      { userId: 'u3', role: 'Garçom', status: 'PENDING', appliedAt: '2026-10-14' }
    ],
    createdAt: '2026-09-12'
  },
  {
    id: 'd3',
    clientName: 'Hotel Grand Plaza',
    clientEmail: 'eventos@grandplaza.com',
    eventName: 'Baile Anual de Caridade',
    eventDate: '2026-10-12',
    startTime: '19:00',
    endTime: '01:00',
    eventType: EventType.GALA,
    guestCount: 250,
    status: DealStatus.CLOSED,
    value: 22000,
    requirements: [{ role: 'Garçom', count: 15 }],
    assignments: [
      { userId: 'u2', role: 'Garçom', status: 'APPROVED', appliedAt: '2026-09-01' }
    ],
    createdAt: '2026-08-20'
  }
];

export const MOCK_FINANCIALS: FinancialEntry[] = [
  {
    id: 'f1',
    dealId: 'd3',
    date: '2025-10-24',
    type: TransactionType.INCOME,
    category: 'Pagamento Cliente',
    description: 'Depósito final para Baile de Gala',
    amount: 12000
  },
  {
    id: 'f2',
    dealId: 'd3',
    date: '2025-10-22',
    type: TransactionType.EXPENSE,
    category: 'Mão de obra',
    description: 'Pagamento garçons (12 equipe x 8h)',
    amount: 4800
  },
  {
    id: 'f3',
    date: '2025-10-21',
    type: TransactionType.EXPENSE,
    category: 'Ingredientes',
    description: 'Frutos do mar e carnes premium',
    amount: 3250.40
  }
];