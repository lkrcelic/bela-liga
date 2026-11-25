import assert from "node:assert/strict";
import {test} from "node:test";
import {firstErrorField} from "@/app/_lib/ui/signupValidation";

// Registracija: after a refused Registriraj se the form brings the first wrong field (in form order) into view (#62)

test("the first wrong field is the one highest in the form, whatever order the errors came in", () => {
  assert.equal(firstErrorField({email: "Taj email se već koristi.", username: "To korisničko ime je zauzeto."}), "username");
  assert.equal(firstErrorField({birth_date: "Obavezno polje.", confirm: "Lozinke se ne podudaraju."}), "confirm");
  assert.equal(firstErrorField({last_name: "Najmanje 3 znaka.", first_name: "Najmanje 3 znaka."}), "first_name");
});

test("no wrong field, or only empty messages: nothing to bring into view", () => {
  assert.equal(firstErrorField({}), undefined);
  assert.equal(firstErrorField({username: undefined, email: ""}), undefined);
});
