import React from "react";
import "./styles.css";

export const Button = ({ children, className, ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
