export function generateOrderNo(prefix: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

export function generateSparePartCode(category: string): string {
  const categoryMap: Record<string, string> = {
    bearing: 'BR',
    belt: 'BT',
    motor: 'MT',
    sensor: 'SR',
    seal: 'SL',
    gear: 'GR',
    other: 'OT',
  };
  const prefix = categoryMap[category] || 'SP';
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}${yy}${mm}${random}`;
}

export function generateEquipmentCode(category: string): string {
  const prefix = category ? category.substring(0, 2).toUpperCase() : 'EQ';
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${yy}${random}`;
}
