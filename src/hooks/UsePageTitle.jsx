import { useEffect } from "react";

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? title : "SANDIGI - Sistem Antrian Digital";
  }, [title]);
}
