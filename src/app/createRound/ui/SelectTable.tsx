"use client";

import {useState, useEffect} from "react";
import {
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
} from "@mui/material";

export interface TableEntry {
  id: number;
  name: string;
}

interface SelectTableProperties {
  onLoad: () => Promise<TableEntry[]>;
  onCreate: (teamIds: number[]) => void;
}

export default function SelectTable({onLoad, onCreate}: SelectTableProperties) {
  const [entries, setEntries] = useState<TableEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TableEntry[]>([]);
  const [switchStates, setSwitchStates] = useState<boolean[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleToggleAll = (checked: boolean) => {
    setSelectAll(checked);
    setSwitchStates(new Array(entries.length).fill(checked));
  };

  const handleToggleSingle = (checked: boolean, index: number) => {
    const updatedStates = [...switchStates];
    updatedStates[index] = checked;
    setSwitchStates(updatedStates);

    // Update "Select All" based on individual toggles
    if (searchTerm !== "") return;
    const allSelected = updatedStates.every((state) => state);
    setSelectAll(allSelected);
  };

  const clickButton = () => {
    const selectedIds = entries.filter((_, index) => switchStates[index]).map((ent) => ent.id);
    onCreate(selectedIds);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);

    // Filter entries based on search term
    const filtered = entries.filter((entry) => entry.name.toLowerCase().includes(term));
    setFilteredEntries(filtered);
  };

  useEffect(() => {
    const fetchData = async () => {
      let data = await onLoad();
      setEntries(data);
      setFilteredEntries(data);
      setSwitchStates(new Array(data.length).fill(true));
      setSelectAll(true);
    };
    fetchData();
  }, []);

  return (
    <>
      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={handleSearch}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Present</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {searchTerm === "" ? (
              <TableRow>
                <TableCell>
                  <b>Select all</b>
                </TableCell>
                <TableCell align="right">
                  <Switch checked={selectAll} onChange={(event) => handleToggleAll(event.target.checked)}></Switch>
                </TableCell>
              </TableRow>
            ) : (
              <></>
            )}

            {filteredEntries.map((ent, index) => (
              <TableRow key={ent.id}>
                <TableCell>{ent.name}</TableCell>
                <TableCell align="right">
                  <Switch
                    checked={switchStates[index]}
                    onChange={(event) => handleToggleSingle(event.target.checked, index)}
                  ></Switch>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="contained" color="primary" onClick={clickButton}>
        Create round
      </Button>
    </>
  );
}
