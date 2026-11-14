import React from 'react';

export const brandFont = '"Righteous", cursive';

export function BrandText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\bahab\b)/gi).map((part, index) =>
        /^ahab$/i.test(part) ? (
          <span key={index} style={{ fontFamily: brandFont }}>
            ahab
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
