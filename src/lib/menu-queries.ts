import { queryOptions } from "@tanstack/react-query";
import { getMenuData } from "./menu.functions";

export const menuQueryOptions = queryOptions({
  queryKey: ["menu"],
  queryFn: () => getMenuData(),
});
