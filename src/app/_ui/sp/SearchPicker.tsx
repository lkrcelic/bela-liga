"use client";

import {color, shadow} from "@/app/_styles/tokens";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {Box, SxProps, Theme} from "@mui/material";
import React, {useEffect, useId, useRef, useState} from "react";
import {buttonBase, ellipsis, mergeSx} from "./base";
import {GhostIconButton} from "./Buttons";
import {SearchInput} from "./Form";
import {Spinner} from "./States";

export type PickerOption = {id: number; title: string; subtitle?: string};

// Search-as-you-type picker (ARIA combobox). Once something is picked it shows as a chip with a clear button.
export function SearchPicker<T extends PickerOption>({
  label,
  placeholder,
  value,
  onChange,
  search,
  renderIcon,
  exclude = [],
  minChars = 2,
  soft,
  sx,
}: {
  label: string;
  placeholder: string;
  value: T | null;
  onChange: (v: T | null) => void;
  search: (q: string) => Promise<T[]>;
  renderIcon: (o: T) => React.ReactNode;
  exclude?: number[];
  minChars?: number;
  soft?: boolean;
  sx?: SxProps<Theme>;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chipRef = useRef<HTMLDivElement | null>(null);
  const reqId = useRef(0);

  // debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < minChars) {
      setOptions([]);
      setLoading(false);
      return;
    }
    const rid = ++reqId.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const found = await search(q);
        if (rid !== reqId.current) return;
        setOptions(found.filter((o) => !exclude.includes(o.id)).slice(0, 8));
        setFailed(false);
        setActive(0);
      } catch {
        if (rid === reqId.current) setFailed(true);
      } finally {
        if (rid === reqId.current) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (o: T) => {
    onChange(o);
    setQuery("");
    setOpen(false);
    // keep focus on the field: the chip's clear button
    setTimeout(() => chipRef.current?.querySelector("button")?.focus(), 0);
  };

  const clear = () => {
    onChange(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(options.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      pick(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && query.trim().length >= minChars;

  return (
    <Box sx={mergeSx({display: "flex", flexDirection: "column", gap: "6px", position: "relative"}, sx)}>
      <Box component="label" htmlFor={id} sx={{fontSize: 14, fontWeight: 600, color: color.inkSoft, pl: "4px"}}>
        {label}
      </Box>
      {value ? (
        <Box
          ref={chipRef}
          sx={{
            height: 56,
            borderRadius: "16px",
            border: `1.5px solid ${color.navy}`,
            background: color.card,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            pl: "8px",
            pr: "6px",
            boxSizing: "border-box",
          }}
        >
          {renderIcon(value)}
          <Box id={id} sx={{flex: 1, display: "flex", flexDirection: "column", minWidth: 0}}>
            <Box component="span" sx={{fontSize: 16, fontWeight: 600, ...ellipsis}}>
              {value.title}
            </Box>
            {value.subtitle && (
              <Box component="span" sx={{fontSize: 13, color: color.muted, ...ellipsis}}>
                {value.subtitle}
              </Box>
            )}
          </Box>
          <GhostIconButton label={`Ukloni: ${value.title}`} onClick={clear}>
            <CloseRoundedIcon />
          </GhostIconButton>
        </Box>
      ) : (
        <SearchInput
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && options[active] ? `${listId}-${options[active].id}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          active={showList}
          soft={soft}
          height={56}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
        />
      )}
      {!value && showList && (
        <Box
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            mt: "4px",
            zIndex: 10,
            background: color.card,
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: shadow.popover,
            border: `1px solid rgba(60,74,103,.12)`,
          }}
        >
          <Box component="ul" id={listId} role="listbox" aria-label={label} sx={{listStyle: "none", m: 0, p: 0}}>
            {options.map((o, i) => (
              <Box
                component="li"
                key={o.id}
                id={`${listId}-${o.id}`}
                role="option"
                aria-selected={i === active}
                // mousedown so the input's blur doesn't close the list first
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o);
                }}
                onMouseEnter={() => setActive(i)}
                sx={{
                  ...buttonBase,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  px: "14px",
                  textAlign: "left",
                  borderBottom: `1px solid ${color.line}`,
                  background: i === active ? color.paperSoft : color.card,
                }}
              >
                {renderIcon(o)}
                <Box component="span" sx={{display: "flex", flexDirection: "column", minWidth: 0}}>
                  <Box component="span" sx={{fontSize: 16, fontWeight: 600, color: color.ink, ...ellipsis}}>
                    {o.title}
                  </Box>
                  {o.subtitle && (
                    <Box component="span" sx={{fontSize: 13, color: color.muted, ...ellipsis}}>
                      {o.subtitle}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
          {(loading || failed || options.length === 0) && (
            <Box role="status" sx={{p: "16px 14px", fontSize: 14, color: color.muted, display: "flex", alignItems: "center", gap: "10px"}}>
              {loading ? (
                <>
                  <Spinner size={18} /> Tražim…
                </>
              ) : failed ? (
                "Pretraga nije uspjela."
              ) : (
                "Nema rezultata."
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
