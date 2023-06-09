import React from 'react';

const RichTextDisplay = ({ styles }) => {
  return (
    <div>
      <p>
        {
          styles.map((style, index) => (
            <span key={index} style={style.style}>
              {style.text}
            </span>
          ))
        }
      </p>
    </div>
  );
};

export default RichTextDisplay;
