export const formatTime = (time: string | Date | null, format: '12h' | '24h' = '24h'): string => {
  if (!time) return '';
  
  const date = typeof time === 'string' ? new Date(`1970-01-01T${time}`) : time;
  
  if (format === '12h') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } else {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
};

export const parseTime = (timeStr: string): string => {
  if (!timeStr) return '';
  
  // If it's already in HH:mm format, return as is
  if (timeStr.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
    return timeStr;
  }
  
  // Parse 12-hour format (e.g., "2:30 PM")
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match && match[1] && match[2] && match[3]) {
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return '';
};
