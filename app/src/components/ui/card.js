import React from "react";
import "./styles.css";

export const Card = ({ children, className }) => {
  return (
    <div className={`p-4 rounded-lg bg-gray-800 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children }) => {
  return <div className="p-2">{children}</div>;
};