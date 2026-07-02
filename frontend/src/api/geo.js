import axios from "axios";

// -------------------------
// GET COUNTRIES
// -------------------------

export const getCountries = async () => {
  const res = await axios.get(
    "https://countriesnow.space/api/v0.1/countries/iso"
  );
                                                            
  return res.data.data.map((c) => c.name).sort();
};
// -------------------------
// GET COUNTRIES WITH DIAL CODES
// -------------------------
export const getCountriesWithCodes = async () => {
  const res = await axios.get("https://restcountries.com/v3.1/all");
                                                                 
  return res.data
    .map((c) => ({
      name: c.name.common,
      code: c.cca2,
      dialCode: c.idd?.root
        ? `${c.idd.root}${c.idd.suffixes?.[0] || ""}`
        : null
    }))
    .filter((c) => c.dialCode)
    .sort((a, b) => a.name.localeCompare(b.name));
};

// -------------------------
// GET CITIES BY COUNTRY
// -------------------------
export const getCitiesByCountry = async (country) => {
  const res = await axios.post(
    "https://countriesnow.space/api/v0.1/countries/cities",
    { country }
  );

  return res.data.data || [];
};
