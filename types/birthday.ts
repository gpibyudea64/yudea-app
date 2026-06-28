export type BirthdayMember = {
  id: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  birthDate: string;
  regionName: string;
  familyName: string;
  address: string;
  pelkat: string | null;
};

export type BirthdayMemberResponse = {
  data: BirthdayMember[];
  meta: {
    start: string;
    end: string;
  };
};
