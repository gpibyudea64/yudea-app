export type BirthdayMember = {
  id: string;
  name: string;
  birthDate: string;
  regionName: string;
};

export type BirthdayMemberResponse = {
  data: BirthdayMember[];
  meta: {
    start: string;
    end: string;
  };
};
