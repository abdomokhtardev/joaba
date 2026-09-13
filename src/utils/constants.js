export const priorityColors = {
  'urgent-important': 'bg-priority-red shadow-[0_0_10px] shadow-priority-red',
  'important': 'bg-priority-amber shadow-[0_0_10px] shadow-priority-amber',
  'urgent': 'bg-priority-blue',
  'none': 'bg-priority-gray'
};

export const priorityLabels = {
  'urgent-important': 'مهم وعاجل',
  'important': 'مهم',
  'urgent': 'عاجل',
  'none': 'عادي'
};

export const getPriorityWeight = (priority) => {
  if (priority === 'urgent-important') return 4;
  if (priority === 'important') return 3;
  if (priority === 'urgent') return 2;
  return 1;
};

export const DEFAULT_PLANS = [
  { id: 'monthly', name: 'شهري', durationDays: 30, price: 100, commission: 20 },
  { id: 'quarterly', name: '3 شهور', durationDays: 90, price: 250, commission: 50 },
  { id: 'yearly', name: 'سنوي', durationDays: 365, price: 900, commission: 150 }
];
