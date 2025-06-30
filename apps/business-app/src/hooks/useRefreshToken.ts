import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { refresh } from "../store/slices/authSlice";

export default function useRefreshToken() {
  const dispatch = useDispatch<AppDispatch>();

  return useCallback(async () => {
    const resultAction = await dispatch(refresh());
    if (refresh.fulfilled.match(resultAction)) {
      return resultAction.payload.access_token as string;
    }
    return null;
  }, [dispatch]);
}
