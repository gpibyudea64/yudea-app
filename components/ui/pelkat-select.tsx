import { formatPelkatName } from "@/lib/client-helper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { MemberPelkat } from "@prisma/client";

export default function PelkatSelect({
  onPelkatChange,
  pelkat,
  onPageChange,
}: {
  pelkat: string;
  onPelkatChange: (value: string) => void;
  onPageChange: (page: number) => void;
}) {
  const pelkatOptions = [
    {
      label: formatPelkatName(MemberPelkat.PELAYANAN_ANAK),
      value: MemberPelkat.PELAYANAN_ANAK,
    },
    {
      label: formatPelkatName(MemberPelkat.PERSEKUTUAN_TARUNA),
      value: MemberPelkat.PERSEKUTUAN_TARUNA,
    },
    {
      label: formatPelkatName(MemberPelkat.GERAKAN_PEMUDA),
      value: MemberPelkat.GERAKAN_PEMUDA,
    },
    {
      label: formatPelkatName(MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN),
      value: MemberPelkat.PERSEKUTUAN_KAUM_PEREMPUAN,
    },
    {
      label: formatPelkatName(MemberPelkat.PERSEKUTUAN_KAUM_BAPAK),
      value: MemberPelkat.PERSEKUTUAN_KAUM_BAPAK,
    },
    {
      label: formatPelkatName(MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA),
      value: MemberPelkat.PERSEKUTUAN_KAUM_LANJUT_USIA,
    },
  ];

  return (
    <Select
      value={pelkat}
      onValueChange={(value) => {
        onPelkatChange(value);
        onPageChange(1);
      }}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Pelkat</SelectItem>
        {pelkatOptions.map((item) => (
          <SelectItem key={item.value} value={String(item.value)}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
