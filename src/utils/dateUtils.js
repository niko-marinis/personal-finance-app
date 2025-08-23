export const formatDate = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getDateRange = (filterType) => {
  const today = new Date();
  
  switch(filterType) {
    case 'daily': {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return {
        startDate: formatDate(today),
        endDate: formatDate(tomorrow)
      };
    }
    
    case 'weekly': {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      return {
        startDate: formatDate(startOfWeek),
        endDate: formatDate(endOfWeek)
      };
    }
    
    case 'monthly': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      
      return {
        startDate: formatDate(startOfMonth),
        endDate: formatDate(endOfMonth)
      };
    }
    
    case 'yearly': {
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const endOfYear = new Date(today.getFullYear() + 1, 0, 1);
      
      return {
        startDate: formatDate(startOfYear),
        endDate: formatDate(endOfYear)
      };
    }
    
    default:
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return {
        startDate: formatDate(today),
        endDate: formatDate(tomorrow)
      };
  }
};