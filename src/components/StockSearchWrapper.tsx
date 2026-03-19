"use client";

import StockSearch from "./StockSearch";

export default function StockSearchWrapper() {
  return (
    <div className="mb-8">
      <StockSearch
        onSelect={(symbol) => {
          window.location.href = `/asset/${symbol}`;
        }}
        placeholder="Search stocks (e.g., AAPL, TSLA, BTC)..."
      />
    </div>
  );
}
