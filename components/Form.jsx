import axios from "axios";
import { useCallback, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  EmojiHappyIcon,
  PhotographIcon,
  XIcon,
} from "@heroicons/react/outline";
import { ref, getDownloadURL, uploadString } from "firebase/storage";
import { Picker } from "emoji-mart";
import useLoginModal from "@/hooks/useLoginModal";
import useRegisterModal from "@/hooks/useRegisterModal";
import useCurrentUser from "@/hooks/useCurrentUser";
import usePosts from "@/hooks/usePosts";
import usePost from "@/hooks/usePost";
import "emoji-mart/css/emoji-mart.css";
2;
import Avatar from "./Avatar";
import Button from "./Button";
import { db, storage } from "@/firebase";
const Form = ({ placeholder, isComment, postId }) => {
  const registerModal = useRegisterModal();
  const loginModal = useLoginModal();
  const filePickerRef = useRef(null);

  const { data: currentUser } = useCurrentUser();
  const { mutate: mutatePosts } = usePosts();
  const { mutate: mutatePost } = usePost(postId);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);

  const addEmoji = (e) => {
    let sym = e.unified.split("-");
    let codesArray = [];
    sym.forEach((el) => codesArray.push("0x" + el));
    let emoji = String.fromCodePoint(...codesArray);
    setInput(input + emoji);
  };

  const addImageToPost = (e) => {
    const reader = new FileReader();
    if (e.target.files[0]) {
      reader.readAsDataURL(e.target.files[0]);
    }

    reader.onload = (readerEvent) => {
      setSelectedFile(readerEvent.target.result);
    };
  };

  const onSubmit = useCallback(async () => {
    try {
      setIsLoading(true);

      const url = isComment ? `/api/comments?postId=${postId}` : "/api/posts";
      const imageRef = ref(storage, `posts/${currentUser?.id}/image`);
      let img = null;
      if (selectedFile) {
        img = await uploadString(imageRef, selectedFile, "data_url").then(
          async () => {
            return await getDownloadURL(imageRef);
          }
        );
      }
      await axios.post(url, { body: input, img });

      toast.success("Tweet created");
      setInput("");
      mutatePosts();
      mutatePost();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [input, mutatePosts, isComment, postId, mutatePost, selectedFile]);

  return (
    <div className="border-b-[1px] border-neutral-800 px-5 py-2">
      {true ? (
        <div className="flex flex-row gap-4">
          <div>
            <Avatar userId={currentUser?.id} />
          </div>
          <div className="divide-y divide-gray-700 w-full">
            <div
              className={`${selectedFile && "pb-7"} ${input && "space-y-2.5"}`}
            >
              <textarea
                disabled={isLoading}
                onChange={(event) => setInput(event.target.value)}
                value={input}
                className="
                disabled:opacity-80
                peer
                resize-none 
                mt-3 
                w-full 
                tracking-wide
                bg-black 
                ring-0 
                outline-none 
                text-[20px] 
                placeholder-neutral-500 
                text-white
              "
                placeholder={placeholder}
              ></textarea>
              {selectedFile && (
                <div className="relative">
                  <div
                    className="absolute w-8 h-8 bg-[#15181c] hover:bg-[#272c26] bg-opacity-75 rounded-full flex items-center justify-center top-1 left-1 cursor-pointer"
                    onClick={() => setSelectedFile(null)}
                  >
                    <XIcon className="text-white h-5" />
                  </div>
                  <img
                    src={selectedFile}
                    alt=""
                    className="rounded-2xl max-h-80 object-contain"
                  />
                </div>
              )}
            </div>
            {!isLoading && (
              <div className="flex items-center justify-between pt-2.5">
                <div className="flex items-center z-10">
                  <div
                    className="icon"
                    onClick={() => filePickerRef.current.click()}
                  >
                    <PhotographIcon className="text-[#1d9bf0] h-[22px]" />
                    <input
                      type="file"
                      ref={filePickerRef}
                      hidden
                      onChange={addImageToPost}
                    />
                  </div>

                  <div
                    className="icon"
                    onClick={() => setShowEmojis(!showEmojis)}
                  >
                    <EmojiHappyIcon className="text-[#1d9bf0] h-[22px]" />
                  </div>

                  {showEmojis && (
                    <Picker
                      onSelect={addEmoji}
                      style={{
                        position: "absolute",
                        marginTop: "465px",
                        marginLeft: -40,
                        maxWidth: "320px",
                        borderRadius: "20px",
                      }}
                      theme="dark"
                    />
                  )}
                </div>
                <div className="mt-4 flex flex-row justify-end">
                  <Button
                    disabled={isLoading || !input}
                    onClick={onSubmit}
                    label="Tweet"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-8">
          <h1 className="text-white text-2xl text-center mb-4 font-bold">
            Welcome to Twitter
          </h1>
          <div className="flex flex-row items-center justify-center gap-4">
            <Button label="Login" onClick={loginModal.onOpen} />
            <Button label="Register" onClick={registerModal.onOpen} secondary />
          </div>
        </div>
      )}
    </div>
  );
};

export default Form;
