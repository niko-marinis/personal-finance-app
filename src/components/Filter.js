import React from 'react';
import { FaSearch } from 'react-icons/fa'; // Add this import

const Filter = ({ 
  activeFilter, 
  setActiveFilter, 
  startDate, 
  setStartDate, 
  endDate, 
  setEndDate, 
  selectedCategory, 
  setSelectedCategory, 
  searchQuery, 
  setSearchQuery,
  showSearch = false,
  onClearFilters 
}) => {
  return (
    <>
      {/* Quick Filter Buttons */}
      <div className="quick-filter-buttons">
        <button 
          className={activeFilter === 'daily' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setActiveFilter('daily')}
        >
          Daily
        </button>
        <button 
          className={activeFilter === 'weekly' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setActiveFilter('weekly')}
        >
          Weekly
        </button>
        <button 
          className={activeFilter === 'monthly' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setActiveFilter('monthly')}
        >
          Monthly
        </button>
        <button 
          className={activeFilter === 'yearly' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setActiveFilter('yearly')}
        >
          Yearly
        </button>
      </div>
      
      {/* Date Filter */}
      <div className="date-filter">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActiveFilter('custom');
              }}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActiveFilter('custom');
              }}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-input"
            >
              <option value="">All Categories</option>
              <optgroup label="Transaction Types">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </optgroup>
              <optgroup label="Expense Categories">
                <option value="Auto & Transport">Auto & Transport</option>
                <option value="Bills">Bills</option>
                <option value="Business">Business</option>
                <option value="Donations">Donations</option>
                <option value="Eating Out">Eating Out</option>
                <option value="Education">Education</option>
                <option value="Entertainment & Rec">Entertainment & Rec</option>
                <option value="Gifts">Gifts</option>
                <option value="Groceries">Groceries</option>
                <option value="Health">Health</option>
                <option value="Home">Home</option>
                <option value="Medical">Medical</option>
                <option value="Pets">Pets</option>
                <option value="Tech">Tech</option>
                <option value="Travel">Travel</option>
              </optgroup>
            </select>
          </div>

          <button 
            className="clear-filter-btn"
            onClick={onClearFilters}
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      {showSearch && (
        <div className="search-container" style={{ marginBottom: '20px' }}>
          <div className="search-box" style={{ position: 'relative', maxWidth: '400px' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Filter;